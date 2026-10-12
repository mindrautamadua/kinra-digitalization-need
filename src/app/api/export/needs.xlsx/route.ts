import { exportContext } from "@/lib/export-auth";
import { buildWorkbook } from "@/lib/export";
import { getSetting } from "@/lib/settings";
import { logAudit } from "@/lib/audit";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const ctx = await exportContext(req);
  if (ctx instanceof Response) return ctx;
  const [thresholds, weights] = await Promise.all([getSetting("score_thresholds"), getSetting("score_weights")]);
  const origin = new URL(req.url).origin;
  const { wb, count } = await buildWorkbook(ctx.filters, thresholds, weights, origin, ctx.user.fullName);
  await logAudit({ actorUserId: ctx.user.id, action: "export_xlsx", entityType: "needs_register", metadata: { filters: ctx.filters, count } });
  const buf = await wb.xlsx.writeBuffer();
  const name = `kinra-needs-register-${new Date().toISOString().slice(0, 10)}.xlsx`;
  return new Response(buf as ArrayBuffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${name}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
