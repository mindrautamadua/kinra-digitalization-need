/** Membuat cookie sesi untuk pengujian HTTP lokal. HANYA untuk lingkungan dev/uji. Pakai: pnpm tsx --env-file=.env.local scripts/dev-session.ts email */
import { createHash, randomBytes } from "node:crypto";
import { SignJWT } from "jose";
import { eq } from "drizzle-orm";
import { db } from "../src/lib/db";
import { sessions, users } from "../src/lib/db/schema";

(async () => {
  if (process.env.NODE_ENV === "production") throw new Error("Tidak untuk production.");
  const email = process.argv[2];
  const u = await db.query.users.findFirst({ where: eq(users.email, email) });
  if (!u) throw new Error("user tidak ditemukan");
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 3600_000);
  await db.insert(sessions).values({ userId: u.id, tokenHash: createHash("sha256").update(token).digest("hex"), expiresAt, userAgent: "dev-session" });
  const jwt = await new SignJWT({ t: token }).setProtectedHeader({ alg: "HS256" }).setIssuedAt().setExpirationTime(expiresAt).sign(new TextEncoder().encode(process.env.SESSION_SECRET!));
  process.stdout.write(`kinra_dna_session=${jwt}`);
  process.exit(0);
})().catch((e) => { console.error(e); process.exit(1); });
