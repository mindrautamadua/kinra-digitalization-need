"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { and, eq, ne } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import { assessmentPeriods, departments, periodDepartments, users, type UserRole } from "@/lib/db/schema";
import { actionRole, AuthError } from "@/lib/auth/guard";
import { logAudit } from "@/lib/audit";
import { hashPassword, passwordPolicyError } from "@/lib/auth/password";
import { revokeAllSessions } from "@/lib/auth/session";
import { departmentRespondentIds, notifyUsers } from "@/lib/notify";
import { setSetting } from "@/lib/settings";
import { weightsAreValid, type ScoreWeights } from "@/lib/scoring";
import type { FormState } from "./respond";

function msg(e: unknown) {
  return e instanceof AuthError ? e.message : e instanceof Error ? e.message : "Terjadi kesalahan.";
}
const s = (fd: FormData, k: string) => String(fd.get(k) ?? "").trim();

// ---------------------------------------------------------------------------
// Bagian
// ---------------------------------------------------------------------------

const deptSchema = z.object({
  code: z.string().trim().min(1, "Kode wajib diisi.").max(32).regex(/^[A-Za-z0-9_-]+$/, "Kode hanya huruf, angka, - dan _."),
  name: z.string().trim().min(1, "Nama wajib diisi.").max(200),
  description: z.string().trim().max(2000).transform((v) => v || null),
  isActive: z.boolean(),
});

export async function saveDepartmentAction(id: string | null, _prev: FormState, fd: FormData): Promise<FormState> {
  try {
    const me = await actionRole("admin");
    const parsed = deptSchema.safeParse({ code: s(fd, "code").toUpperCase(), name: s(fd, "name"), description: s(fd, "description"), isActive: fd.get("isActive") === "on" });
    if (!parsed.success) return { error: parsed.error.issues[0]?.message };
    const dup = await db.query.departments.findFirst({ where: id ? and(eq(departments.code, parsed.data.code), ne(departments.id, id)) : eq(departments.code, parsed.data.code) });
    if (dup) return { error: "Kode Bagian sudah digunakan." };
    if (id) {
      const before = await db.query.departments.findFirst({ where: eq(departments.id, id) });
      if (!before) return { error: "Bagian tidak ditemukan." };
      await db.update(departments).set({ ...parsed.data, updatedAt: new Date() }).where(eq(departments.id, id));
      await logAudit({ actorUserId: me.id, action: "department_updated", entityType: "department", entityId: id, before, after: parsed.data });
    } else {
      const [row] = await db.insert(departments).values(parsed.data).returning();
      await logAudit({ actorUserId: me.id, action: "department_created", entityType: "department", entityId: row.id, after: parsed.data });
    }
    revalidatePath("/admin/departments");
    return { success: "Bagian tersimpan." };
  } catch (e) {
    return { error: msg(e) };
  }
}

// ---------------------------------------------------------------------------
// Pengguna
// ---------------------------------------------------------------------------

const ROLES: UserRole[] = ["admin", "respondent", "assessment_reviewer", "management_viewer"];
const userSchema = z.object({
  email: z.string().trim().toLowerCase().email("Email tidak valid.").max(255),
  fullName: z.string().trim().min(1, "Nama wajib diisi.").max(200),
  jobTitle: z.string().trim().max(200).transform((v) => v || null),
  role: z.enum(ROLES as [UserRole, ...UserRole[]]),
  departmentId: z.string().uuid().or(z.literal("")).transform((v) => v || null),
  isActive: z.boolean(),
  password: z.string(),
});

export async function saveUserAction(id: string | null, _prev: FormState, fd: FormData): Promise<FormState> {
  try {
    const me = await actionRole("admin");
    const parsed = userSchema.safeParse({
      email: s(fd, "email"),
      fullName: s(fd, "fullName"),
      jobTitle: s(fd, "jobTitle"),
      role: s(fd, "role"),
      departmentId: s(fd, "departmentId"),
      isActive: fd.get("isActive") === "on",
      password: String(fd.get("password") ?? ""),
    });
    if (!parsed.success) return { error: parsed.error.issues[0]?.message };
    const d = parsed.data;
    if (d.role === "respondent" && !d.departmentId) return { error: "Responden harus terhubung ke satu Bagian." };
    if (d.departmentId) {
      const dept = await db.query.departments.findFirst({ where: eq(departments.id, d.departmentId) });
      if (!dept) return { error: "Bagian tidak ditemukan." };
    }
    const dup = await db.query.users.findFirst({ where: id ? and(eq(users.email, d.email), ne(users.id, id)) : eq(users.email, d.email) });
    if (dup) return { error: "Email sudah terdaftar." };
    if (d.password) {
      const pe = passwordPolicyError(d.password);
      if (pe) return { error: pe };
    }
    const base = { email: d.email, fullName: d.fullName, jobTitle: d.jobTitle, role: d.role, departmentId: d.departmentId, isActive: d.isActive };
    if (id) {
      const before = await db.query.users.findFirst({ where: eq(users.id, id) });
      if (!before) return { error: "Pengguna tidak ditemukan." };
      if (before.id === me.id && (d.role !== "admin" || !d.isActive)) return { error: "Anda tidak dapat menurunkan role atau menonaktifkan akun sendiri." };
      const set: Partial<typeof users.$inferInsert> = { ...base, updatedAt: new Date() };
      if (d.password) {
        set.passwordHash = await hashPassword(d.password);
        set.mustChangePassword = true;
      }
      await db.update(users).set(set).where(eq(users.id, id));
      if (!d.isActive || d.password || before.role !== d.role) await revokeAllSessions(id);
      await logAudit({
        actorUserId: me.id,
        action: before.role !== d.role ? "user_role_changed" : "user_updated",
        entityType: "user",
        entityId: id,
        before: { ...before },
        after: { ...base, passwordReset: Boolean(d.password) },
      });
    } else {
      if (!d.password) return { error: "Kata sandi awal wajib diisi untuk pengguna baru." };
      const [row] = await db.insert(users).values({ ...base, passwordHash: await hashPassword(d.password), mustChangePassword: true }).returning();
      await logAudit({ actorUserId: me.id, action: "user_created", entityType: "user", entityId: row.id, after: base });
    }
    revalidatePath("/admin/users");
    return { success: id ? "Pengguna diperbarui." : "Pengguna dibuat. Pengguna wajib mengganti kata sandi saat login pertama." };
  } catch (e) {
    return { error: msg(e) };
  }
}

export async function deleteUserAction(id: string, _prev: FormState, fd: FormData): Promise<FormState> {
  try {
    const me = await actionRole("admin");
    if (id === me.id) return { error: "Anda tidak dapat menghapus akun sendiri." };
    const before = await db.query.users.findFirst({ where: eq(users.id, id) });
    if (!before) return { error: "Pengguna tidak ditemukan." };
    if (s(fd, "confirmEmail").toLowerCase() !== before.email) return { error: "Ketik email pengguna dengan tepat untuk konfirmasi." };
    if (before.role === "admin" && before.isActive) {
      const otherAdmin = await db.query.users.findFirst({ where: and(eq(users.role, "admin"), eq(users.isActive, true), ne(users.id, id)) });
      if (!otherAdmin) return { error: "Tidak dapat menghapus satu-satunya Administrator aktif." };
    }
    // FK ke users bersifat set null (jejak data tetap ada) atau cascade (sesi, notifikasi).
    await db.transaction(async (tx) => {
      await tx.delete(users).where(eq(users.id, id));
      await logAudit({ actorUserId: me.id, action: "user_deleted", entityType: "user", entityId: id, before: { ...before } }, tx);
    });
    revalidatePath("/admin/users");
    return { success: "Pengguna dihapus." };
  } catch (e) {
    return { error: msg(e) };
  }
}

// ---------------------------------------------------------------------------
// Periode
// ---------------------------------------------------------------------------

const periodSchema = z.object({
  name: z.string().trim().min(1, "Nama periode wajib diisi.").max(200),
  description: z.string().trim().max(2000).transform((v) => v || null),
  startAt: z.string().min(1, "Tanggal mulai wajib diisi.").transform((v) => new Date(v)),
  dueAt: z.string().min(1, "Tenggat wajib diisi.").transform((v) => new Date(v)),
});

export async function savePeriodAction(id: string | null, _prev: FormState, fd: FormData): Promise<FormState> {
  let newId = "";
  try {
    const me = await actionRole("admin");
    const parsed = periodSchema.safeParse({ name: s(fd, "name"), description: s(fd, "description"), startAt: s(fd, "startAt"), dueAt: s(fd, "dueAt") });
    if (!parsed.success) return { error: parsed.error.issues[0]?.message };
    const d = parsed.data;
    if (Number.isNaN(d.startAt.getTime()) || Number.isNaN(d.dueAt.getTime())) return { error: "Tanggal tidak valid." };
    if (d.dueAt <= d.startAt) return { error: "Tenggat harus setelah tanggal mulai." };
    const deptIds = fd.getAll("departmentIds").map(String).filter(Boolean);
    if (id) {
      const before = await db.query.assessmentPeriods.findFirst({ where: eq(assessmentPeriods.id, id) });
      if (!before) return { error: "Periode tidak ditemukan." };
      await db.transaction(async (tx) => {
        await tx.update(assessmentPeriods).set({ ...d, updatedAt: new Date() }).where(eq(assessmentPeriods.id, id));
        // sinkronkan daftar Bagian: tambah yang baru; hapus yang tidak dipilih hanya bila belum ada submission
        const existing = await tx.query.periodDepartments.findMany({ where: eq(periodDepartments.periodId, id) });
        const existingIds = new Set(existing.map((e) => e.departmentId));
        const toAdd = deptIds.filter((x) => !existingIds.has(x));
        if (toAdd.length) await tx.insert(periodDepartments).values(toAdd.map((departmentId) => ({ periodId: id, departmentId })));
        for (const e of existing) {
          if (!deptIds.includes(e.departmentId)) {
            const sub = await tx.query.departmentSubmissions.findFirst({ where: (t, { and, eq }) => and(eq(t.periodId, id), eq(t.departmentId, e.departmentId)) });
            if (!sub) await tx.delete(periodDepartments).where(eq(periodDepartments.id, e.id));
          }
        }
        await logAudit({ actorUserId: me.id, action: "period_updated", entityType: "assessment_period", entityId: id, before, after: { ...d, departmentIds: deptIds } }, tx);
      });
      revalidatePath(`/admin/periods/${id}`);
      revalidatePath("/admin/periods");
      return { success: "Periode tersimpan." };
    }
    await db.transaction(async (tx) => {
      const [row] = await tx.insert(assessmentPeriods).values({ ...d, createdBy: me.id }).returning();
      newId = row.id;
      if (deptIds.length) await tx.insert(periodDepartments).values(deptIds.map((departmentId) => ({ periodId: row.id, departmentId })));
      await logAudit({ actorUserId: me.id, action: "period_created", entityType: "assessment_period", entityId: row.id, after: { ...d, departmentIds: deptIds } }, tx);
    });
    revalidatePath("/admin/periods");
  } catch (e) {
    return { error: msg(e) };
  }
  redirect(`/admin/periods/${newId}`);
}

export async function setPeriodStatusAction(id: string, status: "draft" | "active" | "closed") {
  const me = await actionRole("admin");
  const before = await db.query.assessmentPeriods.findFirst({ where: eq(assessmentPeriods.id, id), with: { departments: true } });
  if (!before) throw new AuthError("Periode tidak ditemukan.");
  await db.transaction(async (tx) => {
    await tx.update(assessmentPeriods).set({ status, updatedAt: new Date() }).where(eq(assessmentPeriods.id, id));
    await logAudit({ actorUserId: me.id, action: status === "active" ? "period_activated" : status === "closed" ? "period_closed" : "period_reopened_draft", entityType: "assessment_period", entityId: id, before: { status: before.status }, after: { status } }, tx);
    if (status === "active") {
      for (const pd of before.departments) {
        await notifyUsers(
          await departmentRespondentIds(pd.departmentId, tx),
          { title: `Periode assessment aktif: ${before.name}`, body: `Lengkapi profil Bagian dan kebutuhan digitalisasi sebelum ${before.dueAt.toLocaleDateString("id-ID")}.`, link: "/respond" },
          tx,
        );
      }
    }
  });
  revalidatePath("/admin/periods");
  revalidatePath(`/admin/periods/${id}`);
  revalidatePath("/respond");
}

// ---------------------------------------------------------------------------
// Pengaturan
// ---------------------------------------------------------------------------

export async function saveSettingsAction(_prev: FormState, fd: FormData): Promise<FormState> {
  try {
    const me = await actionRole("admin");
    const w: ScoreWeights = {
      scoreImpact: Number(fd.get("w_scoreImpact")),
      scoreRisk: Number(fd.get("w_scoreRisk")),
      scoreUrgency: Number(fd.get("w_scoreUrgency")),
      scoreStrategy: Number(fd.get("w_scoreStrategy")),
      scoreReadiness: Number(fd.get("w_scoreReadiness")),
      scoreReuse: Number(fd.get("w_scoreReuse")),
    };
    if (Object.values(w).some((x) => !Number.isFinite(x))) return { error: "Bobot harus berupa angka." };
    if (!weightsAreValid(w)) return { error: "Total bobot harus tepat 100." };
    const t = { veryHigh: Number(fd.get("t_veryHigh")), high: Number(fd.get("t_high")), medium: Number(fd.get("t_medium")) };
    if (Object.values(t).some((x) => !Number.isFinite(x) || x < 0 || x > 100)) return { error: "Ambang harus 0–100." };
    if (!(t.veryHigh > t.high && t.high > t.medium)) return { error: "Ambang harus menurun: sangat tinggi > tinggi > menengah." };
    await setSetting("score_weights", w, me.id);
    await setSetting("score_thresholds", t, me.id);
    await setSetting("allow_respondent_export", fd.get("allow_respondent_export") === "on", me.id);
    await setSetting("management_can_view_details", fd.get("management_can_view_details") === "on", me.id);
    await logAudit({ actorUserId: me.id, action: "settings_updated", entityType: "app_settings", after: { w, t, allow_respondent_export: fd.get("allow_respondent_export") === "on", management_can_view_details: fd.get("management_can_view_details") === "on" } });
    revalidatePath("/admin/settings");
    return { success: "Pengaturan tersimpan. Skor yang sudah ada tidak dihitung ulang otomatis; simpan ulang review untuk memperbarui." };
  } catch (e) {
    return { error: msg(e) };
  }
}
