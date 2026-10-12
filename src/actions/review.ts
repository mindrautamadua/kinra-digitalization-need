"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import { clarificationThreads, digitalNeeds, needReviews, type NeedStatus } from "@/lib/db/schema";
import { actionRole, AuthError } from "@/lib/auth/guard";
import { logAudit } from "@/lib/audit";
import { departmentRespondentIds, notifyUsers, staffIds } from "@/lib/notify";
import { getSetting } from "@/lib/settings";
import { computeWeightedScore } from "@/lib/scoring";
import { NOTIFY_RESPONDENT, REASON_REQUIRED, STAFF_TRANSITIONS } from "@/lib/workflow";
import { NEED_STATUS_LABELS, COMPLETENESS, ROOT_CAUSE, DUPLICATE_STATUS, SOLUTION_CATEGORY, STRATEGIC_ALIGNMENT, DELAY_RISK, FOLLOW_UP } from "@/lib/enums";
import { needDraftSchema, needFormDataToObject } from "@/lib/validation/need";
import type { FormState } from "./respond";

function msg(e: unknown) {
  return e instanceof AuthError ? e.message : e instanceof Error ? e.message : "Terjadi kesalahan.";
}

async function staffNeed(needId: string) {
  const need = await db.query.digitalNeeds.findFirst({ where: eq(digitalNeeds.id, needId), with: { submission: true, review: true } });
  if (!need) throw new AuthError("Kebutuhan tidak ditemukan.");
  return need;
}

// ---------------------------------------------------------------------------
// Status workflow
// ---------------------------------------------------------------------------

export async function changeStatusAction(needId: string, _prev: FormState, fd: FormData): Promise<FormState> {
  try {
    const me = await actionRole("assessment_reviewer", "admin");
    const need = await staffNeed(needId);
    const to = String(fd.get("status") ?? "") as NeedStatus;
    const reason = String(fd.get("reason") ?? "").trim();
    const allowed = STAFF_TRANSITIONS[need.status] ?? [];
    if (!allowed.includes(to)) return { error: `Transisi dari ${NEED_STATUS_LABELS[need.status]} ke ${NEED_STATUS_LABELS[to] ?? to} tidak diizinkan.` };
    if (REASON_REQUIRED.includes(to) && !reason) return { error: "Alasan wajib diisi untuk status ini." };
    if (to === "prioritized" && need.review?.weightedScore == null) return { error: "Lengkapi skor prioritas (Form C) sebelum menetapkan status Prioritized." };
    if (reason.length > 4000) return { error: "Alasan maksimal 4000 karakter." };
    const now = new Date();
    await db.transaction(async (tx) => {
      await tx.update(digitalNeeds).set({ status: to, statusReason: reason || null, updatedAt: now }).where(eq(digitalNeeds.id, needId));
      await logAudit(
        { actorUserId: me.id, action: "need_status_changed", entityType: "digital_need", entityId: needId, before: { status: need.status }, after: { status: to, reason: reason || null } },
        tx,
      );
      if (to === "clarification_required" && reason) {
        await tx.insert(clarificationThreads).values({ needId, authorId: me.id, message: reason, visibility: "respondent" });
      }
      if (NOTIFY_RESPONDENT.includes(to)) {
        await notifyUsers(
          await departmentRespondentIds(need.submission.departmentId, tx),
          { title: `${need.needCode}: ${NEED_STATUS_LABELS[to]}`, body: reason || need.title, link: `/respond/needs/${needId}` },
          tx,
        );
      }
    });
    revalidatePath(`/needs/${needId}`);
    revalidatePath("/needs");
    return { success: `Status diubah menjadi ${NEED_STATUS_LABELS[to]}.` };
  } catch (e) {
    return { error: msg(e) };
  }
}

export async function archiveNeedAction(needId: string, _prev: FormState, fd: FormData): Promise<FormState> {
  try {
    const me = await actionRole("assessment_reviewer", "admin");
    const need = await staffNeed(needId);
    const reason = String(fd.get("reason") ?? "").trim();
    if (!reason) return { error: "Alasan pengarsipan wajib diisi." };
    await db.transaction(async (tx) => {
      await tx.update(digitalNeeds).set({ status: "archived", archivedAt: new Date(), archiveReason: reason, updatedAt: new Date() }).where(eq(digitalNeeds.id, needId));
      await logAudit({ actorUserId: me.id, action: "need_archived", entityType: "digital_need", entityId: needId, before: { status: need.status }, after: { reason } }, tx);
    });
    revalidatePath("/needs");
  } catch (e) {
    return { error: msg(e) };
  }
  redirect("/needs");
}

// ---------------------------------------------------------------------------
// Form C — review dan skor
// ---------------------------------------------------------------------------

const vals = (o: { value: string }[]) => o.map((x) => x.value) as [string, ...string[]];
const optEnum = (o: { value: string }[]) => z.enum(vals(o)).or(z.literal("")).transform((v) => (v ? v : null));
const optText = z.string().trim().max(4000).transform((v) => (v ? v : null));
const score = z
  .string()
  .transform((v) => (v === "" ? null : Number(v)))
  .pipe(z.number().int().min(1).max(5).nullable());

const reviewSchema = z.object({
  completeness: optEnum(COMPLETENESS),
  rootCauseStatus: optEnum(ROOT_CAUSE),
  duplicateStatus: optEnum(DUPLICATE_STATUS),
  relatedNeedCodes: z.string().trim().max(500),
  solutionCategory: optEnum(SOLUTION_CATEGORY),
  strategicAlignment: optEnum(STRATEGIC_ALIGNMENT),
  delayRisk: optEnum(DELAY_RISK),
  delayRiskReason: optText,
  followUpRecommendation: optEnum(FOLLOW_UP),
  reviewerNotes: optText,
  clarificationQuestions: optText,
  scoreImpact: score,
  scoreRisk: score,
  scoreUrgency: score,
  scoreStrategy: score,
  scoreReadiness: score,
  scoreReuse: score,
  scoreReason: optText,
  criticalFlag: z.boolean(),
  criticalReason: optText,
});

export async function saveReviewAction(needId: string, _prev: FormState, fd: FormData): Promise<FormState> {
  try {
    const me = await actionRole("assessment_reviewer", "admin");
    const need = await staffNeed(needId);
    if (need.status === "draft") return { error: "Kebutuhan masih draft responden; belum dapat direview." };
    const raw: Record<string, unknown> = {};
    for (const k of Object.keys(reviewSchema.shape)) raw[k] = k === "criticalFlag" ? fd.get(k) === "on" : String(fd.get(k) ?? "");
    const parsed = reviewSchema.safeParse(raw);
    if (!parsed.success) return { error: parsed.error.issues.map((i) => `${String(i.path[0])}: ${i.message}`).join("; ") };
    const d = parsed.data;
    if (d.criticalFlag && !d.criticalReason) return { error: "Alasan penandaan risiko kritis wajib diisi." };
    if (d.delayRisk && !d.delayRiskReason) return { error: "Alasan risiko jika ditunda wajib diisi." };
    const anyScore = [d.scoreImpact, d.scoreRisk, d.scoreUrgency, d.scoreStrategy, d.scoreReadiness, d.scoreReuse].some((s) => s != null);
    if (anyScore && !d.scoreReason) return { error: "Alasan penilaian skor wajib diisi." };

    // related need codes -> ids
    let relatedNeedIds: string[] = [];
    if (d.relatedNeedCodes) {
      const codes = d.relatedNeedCodes.split(/[,\s;]+/).map((c) => c.trim().toUpperCase()).filter(Boolean);
      if (codes.length) {
        const rows = await db.query.digitalNeeds.findMany({ where: (t, { inArray }) => inArray(t.needCode, codes), columns: { id: true, needCode: true } });
        const found = new Set(rows.map((r) => r.needCode));
        const missing = codes.filter((c) => !found.has(c));
        if (missing.length) return { error: `Kode kebutuhan tidak ditemukan: ${missing.join(", ")}` };
        relatedNeedIds = rows.map((r) => r.id).filter((id) => id !== needId);
      }
    }
    const weights = await getSetting("score_weights");
    const weightedScore = computeWeightedScore(d, weights);
    const values = {
      needId,
      reviewerId: me.id,
      completeness: d.completeness,
      rootCauseStatus: d.rootCauseStatus,
      duplicateStatus: d.duplicateStatus,
      relatedNeedIds,
      solutionCategory: d.solutionCategory,
      strategicAlignment: d.strategicAlignment,
      delayRisk: d.delayRisk,
      delayRiskReason: d.delayRiskReason,
      followUpRecommendation: d.followUpRecommendation,
      reviewerNotes: d.reviewerNotes,
      clarificationQuestions: d.clarificationQuestions,
      scoreImpact: d.scoreImpact,
      scoreRisk: d.scoreRisk,
      scoreUrgency: d.scoreUrgency,
      scoreStrategy: d.scoreStrategy,
      scoreReadiness: d.scoreReadiness,
      scoreReuse: d.scoreReuse,
      scoreReason: d.scoreReason,
      weightedScore: weightedScore == null ? null : weightedScore.toFixed(2),
      criticalFlag: d.criticalFlag,
      criticalReason: d.criticalFlag ? d.criticalReason : null,
      reviewedAt: new Date(),
      updatedAt: new Date(),
    };
    await db.transaction(async (tx) => {
      const before = need.review;
      await tx
        .insert(needReviews)
        .values(values)
        .onConflictDoUpdate({ target: needReviews.needId, set: values });
      const scoreChanged =
        !before ||
        before.weightedScore !== values.weightedScore ||
        before.scoreImpact !== d.scoreImpact ||
        before.scoreRisk !== d.scoreRisk ||
        before.scoreUrgency !== d.scoreUrgency ||
        before.scoreStrategy !== d.scoreStrategy ||
        before.scoreReadiness !== d.scoreReadiness ||
        before.scoreReuse !== d.scoreReuse;
      await logAudit(
        { actorUserId: me.id, action: scoreChanged ? "need_review_scored" : "need_review_saved", entityType: "need_review", entityId: needId, before: before ?? null, after: values },
        tx,
      );
      if (d.criticalFlag && !before?.criticalFlag) {
        await notifyUsers(await staffIds(tx), { title: `Risiko kritis ditandai: ${need.needCode}`, body: d.criticalReason ?? "", link: `/needs/${needId}` }, tx);
      }
      // Auto: submitted -> under_review saat review pertama tersimpan
      if (need.status === "submitted") {
        await tx.update(digitalNeeds).set({ status: "under_review", updatedAt: new Date() }).where(eq(digitalNeeds.id, needId));
        await logAudit({ actorUserId: me.id, action: "need_status_changed", entityType: "digital_need", entityId: needId, before: { status: "submitted" }, after: { status: "under_review", reason: "Review dimulai" } }, tx);
      }
    });
    revalidatePath(`/needs/${needId}`);
    revalidatePath("/needs");
    return { success: weightedScore == null ? "Review tersimpan. Skor berbobot belum lengkap." : `Review tersimpan. Skor berbobot: ${weightedScore.toFixed(2)}.` };
  } catch (e) {
    return { error: msg(e) };
  }
}

// ---------------------------------------------------------------------------
// Klarifikasi dari staf
// ---------------------------------------------------------------------------

export async function postClarificationAction(needId: string, _prev: FormState, fd: FormData): Promise<FormState> {
  try {
    const me = await actionRole("assessment_reviewer", "admin");
    const need = await staffNeed(needId);
    const message = String(fd.get("message") ?? "").trim();
    const internal = fd.get("internal") === "on";
    if (!message) return { error: "Pesan tidak boleh kosong." };
    if (message.length > 4000) return { error: "Pesan maksimal 4000 karakter." };
    await db.transaction(async (tx) => {
      await tx.insert(clarificationThreads).values({ needId, authorId: me.id, message, visibility: internal ? "internal" : "respondent" });
      if (!internal) {
        await notifyUsers(
          await departmentRespondentIds(need.submission.departmentId, tx),
          { title: `Pesan klarifikasi: ${need.needCode}`, body: message.slice(0, 200), link: `/respond/needs/${needId}` },
          tx,
        );
      }
    });
    revalidatePath(`/needs/${needId}`);
    return { success: internal ? "Catatan internal tersimpan." : "Pesan terkirim ke responden." };
  } catch (e) {
    return { error: msg(e) };
  }
}

// ---------------------------------------------------------------------------
// Koreksi administratif isi Form B oleh staf (tercatat di audit)
// ---------------------------------------------------------------------------

export async function staffEditNeedAction(needId: string, _prev: FormState, fd: FormData): Promise<FormState> {
  try {
    const me = await actionRole("assessment_reviewer", "admin");
    const need = await staffNeed(needId);
    const reason = String(fd.get("editReason") ?? "").trim();
    if (!reason) return { error: "Alasan koreksi administratif wajib diisi." };
    const parsed = needDraftSchema.safeParse(needFormDataToObject(fd));
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      for (const i of parsed.error.issues) fieldErrors[String(i.path[0])] = i.message;
      return { error: "Beberapa isian tidak valid.", fieldErrors };
    }
    const { submission, review, ...before } = need;
    void submission;
    void review;
    await db.transaction(async (tx) => {
      await tx.update(digitalNeeds).set({ ...parsed.data, updatedAt: new Date() }).where(eq(digitalNeeds.id, needId));
      await logAudit({ actorUserId: me.id, action: "need_admin_corrected", entityType: "digital_need", entityId: needId, before, after: parsed.data, metadata: { reason } }, tx);
    });
    revalidatePath(`/needs/${needId}`);
  } catch (e) {
    return { error: msg(e) };
  }
  redirect(`/needs/${needId}`);
}
