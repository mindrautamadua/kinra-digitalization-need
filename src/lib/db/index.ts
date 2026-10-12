import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

declare global {
  var __kinraPgPool: Pool | undefined;
}

function createPool() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL belum diset.");
  return new Pool({
    connectionString: url,
    max: 10,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 10_000,
  });
}

const pool = globalThis.__kinraPgPool ?? createPool();
if (process.env.NODE_ENV !== "production") globalThis.__kinraPgPool = pool;

export const db = drizzle(pool, { schema });
export type Db = typeof db;
export { schema };
