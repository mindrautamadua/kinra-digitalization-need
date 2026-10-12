import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

/**
 * Cookie sesi ada tetapi tidak valid (sesi dicabut/kedaluwarsa, SESSION_SECRET diganti, atau database berganti).
 * Hapus cookie lalu ke /login; tanpa ini proxy memantulkan /login -> / -> /login tanpa henti.
 */
export function GET(req: NextRequest) {
  const res = NextResponse.redirect(new URL("/login", req.url));
  res.cookies.delete(SESSION_COOKIE);
  return res;
}
