import "server-only";
import { db, type Db } from "./db";
import { auditLogs } from "./db/schema";

type Tx = Db | Parameters<Parameters<Db["transaction"]>[0]>[0];

export async function logAudit(
  params: {
    actorUserId: string | null;
    action: string;
    entityType: string;
    entityId?: string | null;
    before?: unknown;
    after?: unknown;
    metadata?: Record<string, unknown>;
  },
  tx: Tx = db,
) {
  await tx.insert(auditLogs).values({
    actorUserId: params.actorUserId,
    action: params.action,
    entityType: params.entityType,
    entityId: params.entityId ?? null,
    beforeJson: params.before === undefined ? null : sanitize(params.before),
    afterJson: params.after === undefined ? null : sanitize(params.after),
    metadata: params.metadata ?? null,
  });
}

const SECRET_KEYS = new Set(["passwordHash", "password", "tokenHash", "token"]);

function sanitize(v: unknown): unknown {
  if (Array.isArray(v)) return v.map(sanitize);
  if (v && typeof v === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, val] of Object.entries(v as Record<string, unknown>)) {
      if (SECRET_KEYS.has(k)) continue;
      out[k] = val instanceof Date ? val.toISOString() : sanitize(val);
    }
    return out;
  }
  return v;
}
