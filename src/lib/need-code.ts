import "server-only";
import { sql } from "drizzle-orm";
import type { Db } from "./db";

type Tx = Db | Parameters<Parameters<Db["transaction"]>[0]>[0];

/** Menghasilkan kode berurutan per tahun: DNA-2026-0001. Gunakan di dalam transaksi. */
export async function nextNeedCode(tx: Tx, year = new Date().getFullYear()) {
  const prefix = `DNA-${year}-`;
  // advisory lock agar tidak bentrok pada insert bersamaan
  await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${prefix}))`);
  const res = await tx.execute(
    sql`select coalesce(max(substring(need_code from ${prefix.length + 1})::int), 0) as n from digital_needs where need_code like ${prefix + "%"}`,
  );
  const rows = res.rows as { n: number | string }[];
  const n = Number(rows[0]?.n ?? 0) + 1;
  return `${prefix}${String(n).padStart(4, "0")}`;
}
