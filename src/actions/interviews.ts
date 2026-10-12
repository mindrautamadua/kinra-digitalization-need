"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import { digitalNeeds, interviews, users, type InterviewStatus } from "@/lib/db/schema";
import { actionRole, AuthError } from "@/lib/auth/guard";
import { logAudit } from "@/lib/audit";
import { departmentRespondentIds, notifyUsers } from "@/lib/notify";
import { INTERVIEW_STATUS_LABELS } from "@/lib/enums";
import type { FormState } from "./respond";

const optText = z.string().trim().max(4000).transform((v) => (v ? v : null));
const optDate = z
  .string()
  .trim()
  .transform((v) => (v ? new Date(v) : null))
  .refine((d) => d == null || !Number.isNaN(d.getTime()), "Tanggal tidak valid.");

const schema = z.object({
  needId: z.string().uuid("Kebutuhan wajib dipilih."),
  objective: optText,
  scheduledAt: optDate,
  participants: optText,
  questions: optText,
  findings: optText,
  currentVsTarget: optText,
  verifiedBaseline: optText,
  dependenciesRisks: optText,
  outcome: optText,
  ownerUserId: z.string().uuid().or(z.literal("")).transform((v) => (v ? v : null)),
  dueAt: optDate,
  status: z.enum(["planned", "scheduled", "completed", "follow_up_required"]),
  sharedWithRespondent: z.boolean(),
  notes: optText,
});

function parse(fd: FormData) {
  const raw: Record<string, unknown> = {};
  for (const k of Object.keys(schema.shape)) raw[k] = k === "sharedWithRespondent" ? fd.get(k) === "on" : String(fd.get(k) ?? "");
  return schema.safeParse(raw);
}

function msg(e: unknown) {
  return e instanceof AuthError ? e.message : e instanceof Error ? e.message : "Terjadi kesalahan.";
}

async function syncNeedStatus(needId: string, status: InterviewStatus, actorId: string, tx: Parameters<Parameters<typeof db.transaction>[0]>[0]) {
  const need = await tx.query.digitalNeeds.findFirst({ where: eq(digitalNeeds.id, needId), with: { submission: true } });
  if (!need) return;
  let to: typeof need.status | null = null;
  if (status === "scheduled" && ["submitted", "under_review", "clarification_required", "interview_completed"].includes(need.status)) to = "interview_scheduled";
  if (status === "completed" && ["interview_scheduled", "under_review", "submitted", "clarification_required"].includes(need.status)) to = "interview_completed";
  if (!to || to === need.status) return;
  await tx.update(digitalNeeds).set({ status: to, updatedAt: new Date() }).where(eq(digitalNeeds.id, needId));
  await logAudit({ actorUserId: actorId, action: "need_status_changed", entityType: "digital_need", entityId: needId, before: { status: need.status }, after: { status: to, reason: "Sinkronisasi dari interview tracker" } }, tx);
  if (to === "interview_scheduled") {
    await notifyUsers(await departmentRespondentIds(need.submission.departmentId, tx), { title: `${need.needCode}: wawancara dijadwalkan`, link: `/respond/needs/${needId}` }, tx);
  }
}

export async function createInterviewAction(_prev: FormState, fd: FormData): Promise<FormState> {
  let newId = "";
  try {
    const me = await actionRole("assessment_reviewer", "admin");
    const parsed = parse(fd);
    if (!parsed.success) return { error: parsed.error.issues.map((i) => i.message).join(" ") };
    const d = parsed.data;
    const need = await db.query.digitalNeeds.findFirst({ where: eq(digitalNeeds.id, d.needId) });
    if (!need || need.status === "draft" || need.status === "archived") return { error: "Kebutuhan tidak valid untuk wawancara." };
    if (d.ownerUserId) {
      const owner = await db.query.users.findFirst({ where: eq(users.id, d.ownerUserId) });
      if (!owner) return { error: "Penanggung jawab tidak ditemukan." };
    }
    await db.transaction(async (tx) => {
      const [row] = await tx.insert(interviews).values({ ...d, createdBy: me.id }).returning();
      newId = row.id;
      await logAudit({ actorUserId: me.id, action: "interview_created", entityType: "interview", entityId: row.id, after: d }, tx);
      await syncNeedStatus(d.needId, d.status, me.id, tx);
    });
    revalidatePath("/interviews");
    revalidatePath(`/needs/${d.needId}`);
  } catch (e) {
    return { error: msg(e) };
  }
  redirect(`/interviews/${newId}`);
}

export async function updateInterviewAction(id: string, _prev: FormState, fd: FormData): Promise<FormState> {
  try {
    const me = await actionRole("assessment_reviewer", "admin");
    const existing = await db.query.interviews.findFirst({ where: eq(interviews.id, id) });
    if (!existing) throw new AuthError("Wawancara tidak ditemukan.");
    const parsed = parse(fd);
    if (!parsed.success) return { error: parsed.error.issues.map((i) => i.message).join(" ") };
    const d = { ...parsed.data, needId: existing.needId }; // need tidak dapat dipindah
    await db.transaction(async (tx) => {
      await tx.update(interviews).set({ ...d, updatedAt: new Date() }).where(eq(interviews.id, id));
      await logAudit({ actorUserId: me.id, action: "interview_updated", entityType: "interview", entityId: id, before: existing, after: d }, tx);
      if (existing.status !== d.status) await syncNeedStatus(existing.needId, d.status, me.id, tx);
    });
    revalidatePath("/interviews");
    revalidatePath(`/interviews/${id}`);
    revalidatePath(`/needs/${existing.needId}`);
    return { success: `Wawancara tersimpan (${INTERVIEW_STATUS_LABELS[d.status]}).` };
  } catch (e) {
    return { error: msg(e) };
  }
}
