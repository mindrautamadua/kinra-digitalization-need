import { exportContext } from "@/lib/export-auth";
import { toCsv } from "@/lib/export";
import { queryRegisterAll } from "@/lib/queries/needs";
import { getSetting } from "@/lib/settings";
import { logAudit } from "@/lib/audit";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const ctx = await exportContext(req);
  if (ctx instanceof Response) return ctx;
  const thresholds = await getSetting("score_thresholds");
  const rows = await queryRegisterAll(ctx.filters, thresholds);
  await logAudit({ actorUserId: ctx.user.id, action: "export_csv", entityType: "needs_register", metadata: { filters: ctx.filters, count: rows.length } });
  const name = `kinra-needs-register-${new Date().toISOString().slice(0, 10)}.csv`;
  return new Response(toCsv(rows, new URL(req.url).origin), {
    headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="${name}"`, "Cache-Control": "private, no-store" },
  });
}
