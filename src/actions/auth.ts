"use server";

import { redirect } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { hashPassword, passwordPolicyError, verifyPassword } from "@/lib/auth/password";
import { createSession, destroySession, getCurrentUser, revokeAllSessions } from "@/lib/auth/session";
import { logAudit } from "@/lib/audit";

export type ActionState = { error?: string; success?: string } | undefined;

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Format email tidak valid."),
  password: z.string().min(1, "Kata sandi wajib diisi."),
  next: z.string().optional(),
});

const MAX_FAILED = 5;
const LOCK_MINUTES = 15;

export async function loginAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    next: formData.get("next") ?? undefined,
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Input tidak valid." };
  const { email, password } = parsed.data;

  const user = await db.query.users.findFirst({ where: eq(users.email, email) });
  const generic = { error: "Email atau kata sandi salah." };
  if (!user || !user.isActive) {
    await logAudit({ actorUserId: null, action: "login_failed", entityType: "user", entityId: null, metadata: { email } });
    return generic;
  }
  if (user.lockedUntil && user.lockedUntil > new Date()) {
    return { error: `Akun terkunci sementara karena terlalu banyak percobaan gagal. Coba lagi setelah ${LOCK_MINUTES} menit.` };
  }
  const ok = await verifyPassword(password, user.passwordHash);
  if (!ok) {
    const failed = user.failedLoginCount + 1;
    await db
      .update(users)
      .set({
        failedLoginCount: failed,
        lockedUntil: failed >= MAX_FAILED ? new Date(Date.now() + LOCK_MINUTES * 60_000) : null,
      })
      .where(eq(users.id, user.id));
    await logAudit({ actorUserId: null, action: "login_failed", entityType: "user", entityId: user.id, metadata: { failed } });
    return generic;
  }
  await db.update(users).set({ failedLoginCount: 0, lockedUntil: null, lastLoginAt: new Date() }).where(eq(users.id, user.id));
  await createSession(user.id);
  if (user.role === "admin" || user.role === "assessment_reviewer") {
    await logAudit({ actorUserId: user.id, action: "login", entityType: "user", entityId: user.id, metadata: { role: user.role } });
  }
  const next = parsed.data.next && parsed.data.next.startsWith("/") && !parsed.data.next.startsWith("//") ? parsed.data.next : "/";
  redirect(user.mustChangePassword ? "/account/password" : next);
}

export async function logoutAction() {
  await destroySession();
  redirect("/login");
}

const changePasswordSchema = z.object({
  current: z.string().min(1, "Kata sandi saat ini wajib diisi."),
  password: z.string(),
  confirm: z.string(),
});

export async function changePasswordAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const me = await getCurrentUser();
  if (!me) redirect("/login");
  const parsed = changePasswordSchema.safeParse({
    current: formData.get("current"),
    password: formData.get("password"),
    confirm: formData.get("confirm"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };
  const { current, password, confirm } = parsed.data;
  const policy = passwordPolicyError(password);
  if (policy) return { error: policy };
  if (password !== confirm) return { error: "Konfirmasi kata sandi tidak sama." };
  const row = await db.query.users.findFirst({ where: and(eq(users.id, me.id)) });
  if (!row || !(await verifyPassword(current, row.passwordHash))) return { error: "Kata sandi saat ini salah." };
  await db
    .update(users)
    .set({ passwordHash: await hashPassword(password), mustChangePassword: false, updatedAt: new Date() })
    .where(eq(users.id, me.id));
  await revokeAllSessions(me.id);
  await createSession(me.id);
  await logAudit({ actorUserId: me.id, action: "password_changed", entityType: "user", entityId: me.id });
  return { success: "Kata sandi berhasil diubah." };
}
