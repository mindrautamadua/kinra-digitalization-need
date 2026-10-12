import "server-only";
import { cookies, headers } from "next/headers";
import { createHash, randomBytes } from "node:crypto";
import { SignJWT, jwtVerify } from "jose";
import { and, eq, gt, isNull } from "drizzle-orm";
import { db } from "@/lib/db";
import { sessions, users, type User } from "@/lib/db/schema";
import { cache } from "react";

export const SESSION_COOKIE = "kinra_dna_session";
const SESSION_TTL_HOURS = 12;

function secretKey() {
  const s = process.env.SESSION_SECRET;
  if (!s || s.length < 32) throw new Error("SESSION_SECRET harus diset (minimal 32 karakter).");
  return new TextEncoder().encode(s);
}

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export async function createSession(userId: string) {
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_TTL_HOURS * 3600 * 1000);
  const h = await headers();
  await db.insert(sessions).values({
    userId,
    tokenHash: hashToken(token),
    expiresAt,
    userAgent: (h.get("user-agent") ?? "").slice(0, 500),
  });
  const jwt = await new SignJWT({ t: token })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(expiresAt)
    .sign(secretKey());
  const c = await cookies();
  c.set(SESSION_COOKIE, jwt, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  });
}

export async function destroySession() {
  const c = await cookies();
  const jwt = c.get(SESSION_COOKIE)?.value;
  if (jwt) {
    try {
      const { payload } = await jwtVerify(jwt, secretKey());
      const token = payload.t as string | undefined;
      if (token) {
        await db.update(sessions).set({ revokedAt: new Date() }).where(eq(sessions.tokenHash, hashToken(token)));
      }
    } catch {
      /* cookie tidak valid, abaikan */
    }
  }
  c.delete(SESSION_COOKIE);
}

export async function revokeAllSessions(userId: string) {
  await db.update(sessions).set({ revokedAt: new Date() }).where(and(eq(sessions.userId, userId), isNull(sessions.revokedAt)));
}

export type SessionUser = Pick<
  User,
  "id" | "email" | "fullName" | "jobTitle" | "role" | "departmentId" | "isActive" | "mustChangePassword"
> & { departmentName: string | null; departmentCode: string | null };

/** Memuat pengguna dari cookie sesi. Di-cache per request. */
export const getCurrentUser = cache(async (): Promise<SessionUser | null> => {
  const c = await cookies();
  const jwt = c.get(SESSION_COOKIE)?.value;
  if (!jwt) return null;
  let token: string | undefined;
  try {
    const { payload } = await jwtVerify(jwt, secretKey());
    token = payload.t as string | undefined;
  } catch {
    return null;
  }
  if (!token) return null;
  const row = await db.query.sessions.findFirst({
    where: and(eq(sessions.tokenHash, hashToken(token)), isNull(sessions.revokedAt), gt(sessions.expiresAt, new Date())),
    with: { },
  });
  if (!row) return null;
  const u = await db.query.users.findFirst({ where: eq(users.id, row.userId), with: { department: true } });
  if (!u || !u.isActive) return null;
  return {
    id: u.id,
    email: u.email,
    fullName: u.fullName,
    jobTitle: u.jobTitle,
    role: u.role,
    departmentId: u.departmentId,
    isActive: u.isActive,
    mustChangePassword: u.mustChangePassword,
    departmentName: u.department?.name ?? null,
    departmentCode: u.department?.code ?? null,
  };
});
