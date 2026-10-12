import "server-only";
import { redirect } from "next/navigation";
import { getCurrentUser, type SessionUser } from "./session";
import type { UserRole } from "@/lib/db/schema";

export class AuthError extends Error {
  constructor(message = "Anda tidak memiliki akses untuk tindakan ini.") {
    super(message);
    this.name = "AuthError";
  }
}

export async function requireUser(): Promise<SessionUser> {
  const u = await getCurrentUser();
  if (!u) redirect("/api/auth/session-expired");
  return u;
}

export async function requireRole(...roles: UserRole[]): Promise<SessionUser> {
  const u = await requireUser();
  if (!roles.includes(u.role)) redirect("/forbidden");
  return u;
}

/** Varian untuk server action: lempar error, bukan redirect. */
export async function actionUser(): Promise<SessionUser> {
  const u = await getCurrentUser();
  if (!u) throw new AuthError("Sesi berakhir. Silakan login kembali.");
  return u;
}

export async function actionRole(...roles: UserRole[]): Promise<SessionUser> {
  const u = await actionUser();
  if (!roles.includes(u.role)) throw new AuthError();
  return u;
}

export const isStaff = (u: SessionUser) => u.role === "admin" || u.role === "assessment_reviewer";
export const canViewAll = (u: SessionUser) => isStaff(u) || u.role === "management_viewer";
