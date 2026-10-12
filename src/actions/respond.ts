"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { and, desc, eq, ne } from "drizzle-orm";
import { db } from "@/lib/db";
import { assessmentPeriods, clarificationThreads, departmentSubmissions, digitalNeeds, needAttachments, periodDepartments } from "@/lib/db/schema";
import { actionRole, AuthError } from "@/lib/auth/guard";
import { logAudit } from "@/lib/audit";
import { notifyUsers, staffIds } from "@/lib/notify";
import { nextNeedCode } from "@/lib/need-code";
import { needDraftSchema, needFormDataToObject, profileSchema, validateNeedForSubmit } from "@/lib/validation/need";
import { saveFile, validateUpload } from "@/lib/storage";
import { getSetting } from "@/lib/settings";
import { RESPONDENT_EDITABLE } from "@/lib/queries/respond";

export type FormState = { error?: string; success?: string; fieldErrors?: Record<string, string> } | undefined;

function msg(e: unknown) {
  return e instanceof AuthError ? e.message : e instanceof Error ? e.message : "Terjadi kesalahan.";
}

/** Memastikan periode aktif, belum lewat penutupan, dan Bagian terdaftar. Mengembalikan submission (dibuat bila belum ada). */
async function ensureSubmission(userId: string, departmentId: string, periodId: string) {
  const period = await db.query.assessmentPeriods.findFirst({ where: eq(assessmentPeriods.id, periodId) });
  if (!period || period.status !== "active") throw new AuthError("Periode assessment tidak aktif.");
  const pd = await db.query.periodDepartments.findFirst({
    where: and(eq(periodDepartments.periodId, periodId), eq(periodDepartments.departmentId, departmentId)),
  });
  if (!pd) throw new AuthError("Bagian Anda tidak termasuk dalam periode ini.");
  let sub = await db.query.departmentSubmissions.findFirst({
    where: and(eq(departmentSubmissions.periodId, periodId), eq(departmentSubmissions.departmentId, departmentId)),
  });
  if (!sub) {
    [sub] = await db
      .insert(departmentSubmissions)
      .values({ periodId, departmentId, respondentId: userId })
      .onConflictDoNothing()
      .returning();
    if (!sub) {
      sub = (await db.query.departmentSubmissions.findFirst({
        where: and(eq(departmentSubmissions.periodId, periodId), eq(departmentSubmissions.departmentId, departmentId)),
      }))!;
    }
  }
  return { period, sub };
}

async function ownedNeed(userId: string, departmentId: string, needId: string) {
  const need = await db.query.digitalNeeds.findFirst({ where: eq(digitalNeeds.id, needId), with: { submission: { with: { period: true } } } });
  if (!need || need.submission.departmentId !== departmentId) throw new AuthError("Kebutuhan tidak ditemukan atau bukan milik Bagian Anda.");
  void userId;
  return need;
}

// ---------------------------------------------------------------------------
// Form A
// ---------------------------------------------------------------------------

export async function saveProfileAction(periodId: string, _prev: FormState, fd: FormData): Promise<FormState> {
  try {
    const me = await actionRole("respondent");
    if (!me.departmentId) throw new AuthError("Akun Anda belum terhubung ke Bagian.");
    const { sub } = await ensureSubmission(me.id, me.departmentId, periodId);
    const parsed = profileSchema.safeParse({
      respondentName: fd.get("respondentName"),
      respondentJobTitle: fd.get("respondentJobTitle"),
      processOwnerName: fd.get("processOwnerName"),
      estimatedUsersRange: fd.get("estimatedUsersRange") ?? "",
      mainProcesses: fd.get("mainProcesses"),
      mainServices: fd.get("mainServices") ?? "",
      currentSystems: fd.get("currentSystems") ?? "",
      dominantWorkMode: fd.get("dominantWorkMode") ?? "",
      attestation: fd.get("attestation") === "on",
    });
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      for (const i of parsed.error.issues) fieldErrors[String(i.path[0])] = i.message;
      return { error: "Periksa kembali isian yang ditandai.", fieldErrors };
    }
    const before = { ...sub };
    const [after] = await db
      .update(departmentSubmissions)
      .set({ ...parsed.data, respondentId: me.id, updatedAt: new Date() })
      .where(eq(departmentSubmissions.id, sub.id))
      .returning();
    await logAudit({ actorUserId: me.id, action: "profile_saved", entityType: "department_submission", entityId: sub.id, before, after });
    revalidatePath("/respond");
    return { success: "Profil Bagian tersimpan." };
  } catch (e) {
    return { error: msg(e) };
  }
}

// ---------------------------------------------------------------------------
// Form B
// ---------------------------------------------------------------------------

export async function createNeedAction(periodId: string) {
  const me = await actionRole("respondent");
  if (!me.departmentId) throw new AuthError("Akun Anda belum terhubung ke Bagian.");
  const { sub } = await ensureSubmission(me.id, me.departmentId, periodId);
  // Kode kebutuhan baru diberikan saat dikirim agar draft yang ditinggalkan tidak menghabiskan nomor.
  // Pemilik proses dan kesiapan diisi awal dari Profil Bagian / kebutuhan terakhir Bagian ini; responden tetap dapat mengubahnya.
  const prev = await db.query.digitalNeeds.findFirst({
    where: and(eq(digitalNeeds.submissionId, sub.id), ne(digitalNeeds.status, "archived")),
    orderBy: [desc(digitalNeeds.updatedAt)],
    columns: { processOwner: true, dataReadiness: true, processReadiness: true, ownerReadiness: true },
  });
  const prefill = {
    processOwner: prev?.processOwner || sub.processOwnerName || null,
    dataReadiness: prev?.dataReadiness ?? null,
    processReadiness: prev?.processReadiness ?? null,
    ownerReadiness: prev?.ownerReadiness ?? null,
  };
  const need = await db.transaction(async (tx) => {
    const [row] = await tx.insert(digitalNeeds).values({ submissionId: sub.id, createdBy: me.id, ...prefill }).returning();
    await logAudit({ actorUserId: me.id, action: "need_created", entityType: "digital_need", entityId: row.id, after: prefill }, tx);
    return row;
  });
  redirect(`/respond/needs/${need.id}/edit`);
}

/** Menyimpan Form B. intent=draft hanya menyimpan; intent=submit memvalidasi kolom wajib lalu mengirim. */
export async function saveNeedAction(needId: string, _prev: FormState, fd: FormData): Promise<FormState> {
  const intent = fd.get("intent") === "submit" ? "submit" : "draft";
  try {
    const me = await actionRole("respondent");
    if (!me.departmentId) throw new AuthError();
    const need = await ownedNeed(me.id, me.departmentId, needId);
    if (!RESPONDENT_EDITABLE.has(need.status)) return { error: "Kebutuhan ini sudah dikirim dan tidak dapat diubah kecuali dikembalikan oleh Tim Assessment." };
    if (need.submission.period.status !== "active") return { error: "Periode assessment sudah ditutup; perubahan tidak diizinkan." };
    const parsed = needDraftSchema.safeParse(needFormDataToObject(fd));
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      for (const i of parsed.error.issues) fieldErrors[String(i.path[0])] = i.message;
      return { error: "Beberapa isian melebihi batas atau tidak valid.", fieldErrors };
    }
    // Simpan dulu agar input tidak hilang walau validasi submit gagal.
    await db.update(digitalNeeds).set({ ...parsed.data, updatedAt: new Date() }).where(eq(digitalNeeds.id, needId));
    if (intent === "draft") {
      revalidatePath(`/respond/needs/${needId}`);
      return { success: "Draft tersimpan." };
    }
    const fieldErrors = validateNeedForSubmit(parsed.data);
    if (Object.keys(fieldErrors).length > 0) {
      return { error: "Draft tersimpan, tetapi kolom wajib berikut belum lengkap.", fieldErrors };
    }
    // Profil Bagian (Form A) harus lengkap sebelum submit kebutuhan.
    const sub = await db.query.departmentSubmissions.findFirst({ where: eq(departmentSubmissions.id, need.submissionId) });
    if (!sub || !sub.attestation || !sub.mainProcesses || !sub.processOwnerName || !sub.respondentJobTitle) {
      return { error: "Draft tersimpan. Lengkapi Profil Bagian (Form A) termasuk pernyataan peninjauan sebelum mengirim kebutuhan." };
    }
    const now = new Date();
    const wasResubmit = need.status !== "draft";
    await db.transaction(async (tx) => {
      const needCode = need.needCode ?? (await nextNeedCode(tx));
      await tx
        .update(digitalNeeds)
        .set({ needCode, status: "submitted", statusReason: null, submittedAt: need.submittedAt ?? now, lastSubmittedAt: now, updatedAt: now })
        .where(eq(digitalNeeds.id, needId));
      await tx
        .update(departmentSubmissions)
        .set({ status: "submitted", submittedAt: sub.submittedAt ?? now, respondentId: sub.respondentId ?? me.id, updatedAt: now })
        .where(eq(departmentSubmissions.id, sub.id));
      await logAudit(
        { actorUserId: me.id, action: wasResubmit ? "need_resubmitted" : "need_submitted", entityType: "digital_need", entityId: needId, before: { status: need.status }, after: { status: "submitted", needCode } },
        tx,
      );
      await notifyUsers(
        await staffIds(tx),
        { title: `${wasResubmit ? "Revisi" : "Kebutuhan baru"} dikirim: ${needCode}`, body: parsed.data.title, link: `/needs/${needId}` },
        tx,
      );
    });
    revalidatePath("/respond");
  } catch (e) {
    return { error: msg(e) };
  }
  redirect(`/respond/needs/${needId}?submitted=1`);
}

export async function deleteDraftNeedAction(needId: string) {
  const me = await actionRole("respondent");
  if (!me.departmentId) throw new AuthError();
  const need = await ownedNeed(me.id, me.departmentId, needId);
  if (need.status !== "draft" || need.submittedAt) throw new AuthError("Hanya draft yang belum pernah dikirim yang dapat dihapus.");
  await db.transaction(async (tx) => {
    await tx.update(digitalNeeds).set({ status: "archived", archivedAt: new Date(), archiveReason: "Draft dihapus oleh responden" }).where(eq(digitalNeeds.id, needId));
    await logAudit({ actorUserId: me.id, action: "need_draft_deleted", entityType: "digital_need", entityId: needId }, tx);
  });
  revalidatePath("/respond");
  redirect("/respond");
}

// ---------------------------------------------------------------------------
// Lampiran
// ---------------------------------------------------------------------------

export async function uploadAttachmentAction(needId: string, _prev: FormState, fd: FormData): Promise<FormState> {
  try {
    const me = await actionRole("respondent", "assessment_reviewer", "admin");
    const need = await db.query.digitalNeeds.findFirst({ where: eq(digitalNeeds.id, needId), with: { submission: true } });
    if (!need) throw new AuthError();
    if (me.role === "respondent") {
      if (need.submission.departmentId !== me.departmentId) throw new AuthError();
      if (!RESPONDENT_EDITABLE.has(need.status)) return { error: "Lampiran hanya dapat ditambahkan saat kebutuhan masih dapat diedit." };
    }
    const file = fd.get("file");
    if (!(file instanceof File)) return { error: "Pilih file terlebih dahulu." };
    const buf = Buffer.from(await file.arrayBuffer());
    const err = validateUpload({ name: file.name, type: file.type, size: buf.length }, new Uint8Array(buf.subarray(0, 8)));
    if (err) return { error: err };
    const key = await saveFile(needId, buf, file.name, file.type);
    const [row] = await db
      .insert(needAttachments)
      .values({ needId, storageKey: key, originalFilename: file.name.slice(0, 255), mimeType: file.type, sizeBytes: buf.length, uploadedBy: me.id })
      .returning();
    await logAudit({ actorUserId: me.id, action: "attachment_uploaded", entityType: "need_attachment", entityId: row.id, after: { needId, filename: file.name, size: buf.length } });
    revalidatePath(`/respond/needs/${needId}`);
    revalidatePath(`/needs/${needId}`);
    return { success: "Lampiran diunggah." };
  } catch (e) {
    return { error: msg(e) };
  }
}

export async function archiveAttachmentAction(attachmentId: string) {
  const me = await actionRole("respondent", "assessment_reviewer", "admin");
  const att = await db.query.needAttachments.findFirst({ where: eq(needAttachments.id, attachmentId), with: { need: { with: { submission: true } } } });
  if (!att) throw new AuthError();
  if (me.role === "respondent" && (att.need.submission.departmentId !== me.departmentId || !RESPONDENT_EDITABLE.has(att.need.status))) throw new AuthError();
  await db.update(needAttachments).set({ archivedAt: new Date() }).where(eq(needAttachments.id, attachmentId));
  await logAudit({ actorUserId: me.id, action: "attachment_archived", entityType: "need_attachment", entityId: attachmentId, before: { filename: att.originalFilename } });
  revalidatePath(`/respond/needs/${att.needId}`);
  revalidatePath(`/needs/${att.needId}`);
}

// ---------------------------------------------------------------------------
// Klarifikasi (balasan responden)
// ---------------------------------------------------------------------------

export async function replyClarificationAction(needId: string, _prev: FormState, fd: FormData): Promise<FormState> {
  try {
    const me = await actionRole("respondent");
    if (!me.departmentId) throw new AuthError();
    const need = await ownedNeed(me.id, me.departmentId, needId);
    const message = String(fd.get("message") ?? "").trim();
    if (!message) return { error: "Pesan tidak boleh kosong." };
    if (message.length > 4000) return { error: "Pesan maksimal 4000 karakter." };
    await db.transaction(async (tx) => {
      await tx.insert(clarificationThreads).values({ needId, authorId: me.id, message, visibility: "respondent" });
      await notifyUsers(await staffIds(tx), { title: `Balasan klarifikasi: ${need.needCode}`, body: message.slice(0, 200), link: `/needs/${needId}` }, tx);
    });
    revalidatePath(`/respond/needs/${needId}`);
    return { success: "Balasan terkirim." };
  } catch (e) {
    return { error: msg(e) };
  }
}

export async function respondentExportEnabled() {
  return getSetting("allow_respondent_export");
}
