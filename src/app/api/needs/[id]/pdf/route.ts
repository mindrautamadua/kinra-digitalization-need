import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { loadNeedFor } from "@/lib/queries/respond";
import { getSetting } from "@/lib/settings";
import { logAudit } from "@/lib/audit";
import { renderNeedPdf } from "@/lib/need-pdf";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** Cetak satu kebutuhan sebagai PDF. Hak akses sama dengan halaman detail. */
export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const me = await getCurrentUser();
  if (!me) return new NextResponse("Unauthorized", { status: 401 });
  const { id } = await ctx.params;
  const need = await loadNeedFor(me, id);
  if (!need) return new NextResponse("Not found", { status: 404 });
  if (me.role === "respondent" && need.status === "archived") return new NextResponse("Not found", { status: 404 });
  if (me.role === "management_viewer" && !(await getSetting("management_can_view_details"))) return new NextResponse("Forbidden", { status: 403 });

  const [weights, thresholds] = await Promise.all([getSetting("score_weights"), getSetting("score_thresholds")]);
  const pdf = await renderNeedPdf(need, {
    audience: me.role === "respondent" ? "respondent" : "staff",
    weights,
    thresholds,
    printedBy: me.fullName,
  });
  await logAudit({ actorUserId: me.id, action: "export_pdf", entityType: "digital_need", entityId: need.id });

  const name = `kinra-${need.needCode ?? "draft"}.pdf`.replace(/[^\w.\-]+/g, "_");
  return new NextResponse(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Length": String(pdf.length),
      "Content-Disposition": `inline; filename="${name}"`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
