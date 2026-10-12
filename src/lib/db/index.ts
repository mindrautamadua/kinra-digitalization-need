import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

declare global {
  var __kinraPgPool: Pool | undefined;
}

function createPool() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL belum diset.");
  // Serverless (Vercel): tiap instance fungsi punya pool sendiri, jadi jaga tetap kecil
  // agar total koneksi tidak melewati batas pooler Supabase.
  const serverless = Boolean(process.env.VERCEL);
  return new Pool({
    connectionString: url,
    max: Number(process.env.DATABASE_POOL_MAX) || (serverless ? 3 : 10),
    idleTimeoutMillis: serverless ? 5_000 : 30_000,
    connectionTimeoutMillis: 10_000,
  });
}

const pool = globalThis.__kinraPgPool ?? createPool();
globalThis.__kinraPgPool = pool;

export const db = drizzle(pool, { schema });
export type Db = typeof db;
export { schema };
