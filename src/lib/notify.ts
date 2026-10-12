import "server-only";
import { and, eq, inArray } from "drizzle-orm";
import { db, type Db } from "./db";
import { notifications, users } from "./db/schema";

type Tx = Db | Parameters<Parameters<Db["transaction"]>[0]>[0];

export async function notifyUsers(
  userIds: string[],
  n: { title: string; body?: string; link?: string },
  tx: Tx = db,
) {
  const ids = Array.from(new Set(userIds.filter(Boolean)));
  if (ids.length === 0) return;
  await tx.insert(notifications).values(ids.map((userId) => ({ userId, title: n.title, body: n.body, link: n.link })));
}

/** Semua responden aktif pada suatu Bagian. */
export async function departmentRespondentIds(departmentId: string, tx: Tx = db) {
  const rows = await tx
    .select({ id: users.id })
    .from(users)
    .where(and(eq(users.departmentId, departmentId), eq(users.isActive, true), inArray(users.role, ["respondent"])));
  return rows.map((r) => r.id);
}

/** Semua reviewer dan admin aktif. */
export async function staffIds(tx: Tx = db) {
  const rows = await tx
    .select({ id: users.id })
    .from(users)
    .where(and(eq(users.isActive, true), inArray(users.role, ["admin", "assessment_reviewer"])));
  return rows.map((r) => r.id);
}
