import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { assessmentPeriods, departments } from "@/lib/db/schema";
import { exportContext } from "@/lib/export-auth";
import { queryRegisterAll, type RegisterFilters } from "@/lib/queries/needs";
import { loadNeedsByIds } from "@/lib/queries/respond";
import { getSetting } from "@/lib/settings";
import { logAudit } from "@/lib/audit";
import { renderNeedsReportPdf } from "@/lib/need-pdf";
import { IMPACTS, NEED_STATUS_LABELS, SOLUTION_CATEGORY, URGENCY, labelOf } from "@/lib/enums";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** Batas jumlah kebutuhan per laporan agar ukuran PDF dan waktu render tetap wajar. */
const MAX_NEEDS = 500;

const PRIORITY_LABELS: Record<string, string> = {
  very_high: "Sangat tinggi",
  high: "Tinggi",
  medium: "Menengah",
  low: "Rendah",
  unscored: "Belum dinilai",
};

async function describeFilters(f: RegisterFilters) {
  const parts: string[] = [];
  if (f.period) {
    const p = await db.query.assessmentPeriods.findFirst({ where: eq(assessmentPeriods.id, f.period), columns: { name: true } });
    parts.push(`Periode ${p?.name ?? "-"}`);
  }
  const deptId = f.department ?? f.departmentIdRestrict;
  if (deptId) {
    const d = await db.query.departments.findFirst({ where: eq(departments.id, deptId), columns: { name: true } });
    parts.push(`Bagian ${d?.name ?? "-"}`);
  }
  if (f.status) parts.push(`Status ${NEED_STATUS_LABELS[f.status] ?? f.status}`);
  if (f.urgency) parts.push(`Urgensi ${labelOf(URGENCY, f.urgency)}`);
  if (f.impact) parts.push(`Dampak ${labelOf(IMPACTS, f.impact)}`);
  if (f.solution) parts.push(`Solusi ${labelOf(SOLUTION_CATEGORY, f.solution)}`);
  if (f.interview) parts.push(f.interview === "yes" ? "Perlu / ada wawancara" : "Tanpa wawancara");
  if (f.priority) parts.push(`Prioritas ${PRIORITY_LABELS[f.priority] ?? f.priority}`);
  if (f.critical === "1") parts.push("Risiko kritis");
  if (f.q) parts.push(`Pencarian "${f.q}"`);
  return parts.length ? parts.join("; ") : "Semua kebutuhan (tanpa filter)";
}

export async function GET(req: Request) {
  const ctx = await exportContext(req);
  if (ctx instanceof Response) return ctx;
  const [thresholds, weights] = await Promise.all([getSetting("score_thresholds"), getSetting("score_weights")]);
  const rows = await queryRegisterAll(ctx.filters, thresholds, MAX_NEEDS + 1);
  if (rows.length > MAX_NEEDS) {
    return new Response(`Terlalu banyak kebutuhan (> ${MAX_NEEDS}) untuk dicetak sekaligus. Persempit filter, misalnya per periode atau per Bagian.`, {
      status: 413,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }
  // Pertahankan urutan register (sesuai pilihan urutan pada filter).
  const byId = new Map((await loadNeedsByIds(rows.map((r) => r.id))).map((n) => [n.id, n]));
  const needs = rows.flatMap((r) => byId.get(r.id) ?? []);

  const pdf = await renderNeedsReportPdf(needs, {
    audience: ctx.user.role === "respondent" ? "respondent" : "staff",
    weights,
    thresholds,
    printedBy: ctx.user.fullName,
    filterSummary: await describeFilters(ctx.filters),
  });
  await logAudit({ actorUserId: ctx.user.id, action: "export_pdf", entityType: "needs_register", metadata: { filters: ctx.filters, count: needs.length } });

  const name = `kinra-laporan-kebutuhan-${new Date().toISOString().slice(0, 10)}.pdf`;
  return new Response(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Length": String(pdf.length),
      "Content-Disposition": `inline; filename="${name}"`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
