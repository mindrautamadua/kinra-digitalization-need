import "server-only";
import ExcelJS from "exceljs";
import { and, eq, inArray, ne } from "drizzle-orm";
import { db } from "@/lib/db";
import { departments, assessmentPeriods, interviews, digitalNeeds, departmentSubmissions } from "@/lib/db/schema";
import { queryRegisterAll, type RegisterFilters, type RegisterRow } from "@/lib/queries/needs";
import { FOLLOW_UP, IMPACTS, INTERVIEW_STATUS_LABELS, NEED_STATUS_LABELS, SCORE_CRITERIA, SOLUTION_CATEGORY, URGENCY, labelOf, labelsOf } from "@/lib/enums";
import { priorityCategory, type ScoreThresholds, type ScoreWeights } from "@/lib/scoring";

export const REGISTER_COLUMNS: { header: string; key: string; width?: number; get: (r: RegisterRow, origin: string) => unknown }[] = [
  { header: "Assessment ID", key: "periodName", width: 22, get: (r) => r.periodName },
  { header: "Need ID", key: "needCode", width: 16, get: (r) => r.needCode },
  { header: "Bagian", key: "departmentName", width: 28, get: (r) => r.departmentName },
  { header: "Judul kebutuhan", key: "title", width: 40, get: (r) => r.title },
  { header: "Proses", key: "businessProcess", width: 40, get: (r) => r.businessProcess },
  { header: "Masalah utama", key: "problemDescription", width: 60, get: (r) => r.problemDescription },
  { header: "Dampak", key: "impacts", width: 30, get: (r) => labelsOf(IMPACTS, r.impacts) },
  { header: "Urgensi responden", key: "respondentUrgency", width: 16, get: (r) => labelOf(URGENCY, r.respondentUrgency) },
  { header: "Kategori solusi awal", key: "solutionCategory", width: 22, get: (r) => (r.solutionCategory ? labelOf(SOLUTION_CATEGORY, r.solutionCategory) : "") },
  { header: "Status review", key: "status", width: 22, get: (r) => NEED_STATUS_LABELS[r.status] ?? r.status },
  { header: "Perlu wawancara", key: "interview", width: 14, get: (r) => (r.followUp === "interview" || r.status === "interview_scheduled" || r.status === "interview_completed" ? "Ya" : "Tidak") },
  { header: "Skor prioritas", key: "weightedScore", width: 14, get: (r) => (r.weightedScore == null ? null : Number(r.weightedScore)) },
  { header: "Pemilik proses", key: "processOwner", width: 24, get: (r) => r.processOwner },
  { header: "Reviewer", key: "reviewerName", width: 22, get: (r) => r.reviewerName },
  { header: "Tanggal submit", key: "submittedAt", width: 18, get: (r) => r.submittedAt },
  { header: "Tanggal update terakhir", key: "updatedAt", width: 18, get: (r) => r.updatedAt },
  { header: "Rekomendasi tindak lanjut", key: "followUp", width: 24, get: (r) => (r.followUp ? labelOf(FOLLOW_UP, r.followUp) : "") },
  { header: "Tautan detail", key: "link", width: 40, get: (r, origin) => `${origin}/needs/${r.id}` },
];

export function toCsv(rows: RegisterRow[], origin: string) {
  const esc = (v: unknown) => {
    if (v == null) return "";
    const s = v instanceof Date ? v.toISOString() : String(v);
    return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const lines = [REGISTER_COLUMNS.map((c) => esc(c.header)).join(",")];
  for (const r of rows) lines.push(REGISTER_COLUMNS.map((c) => esc(c.get(r, origin))).join(","));
  return "﻿" + lines.join("\r\n");
}

export async function buildWorkbook(f: RegisterFilters, thresholds: ScoreThresholds, weights: ScoreWeights, origin: string, exportedBy: string) {
  const rows = await queryRegisterAll(f, thresholds);
  const wb = new ExcelJS.Workbook();
  wb.creator = "KINRA DNA";
  wb.created = new Date();

  // --- Summary
  const summary = wb.addWorksheet("Summary");
  summary.columns = [{ width: 36 }, { width: 18 }];
  summary.addRow(["KINRA Digitalization Needs Assessment — Ringkasan"]).font = { bold: true, size: 14 };
  summary.addRow(["Diekspor", new Date()]);
  summary.addRow(["Oleh", exportedBy]);
  summary.addRow(["Jumlah kebutuhan (sesuai filter)", rows.length]);
  summary.addRow([]);
  summary.addRow(["Menurut status", "Jumlah"]).font = { bold: true };
  const byStatus = new Map<string, number>();
  for (const r of rows) byStatus.set(r.status, (byStatus.get(r.status) ?? 0) + 1);
  for (const [k, n] of byStatus) summary.addRow([NEED_STATUS_LABELS[k] ?? k, n]);
  summary.addRow([]);
  summary.addRow(["Menurut Bagian", "Jumlah"]).font = { bold: true };
  const byDept = new Map<string, number>();
  for (const r of rows) byDept.set(r.departmentName, (byDept.get(r.departmentName) ?? 0) + 1);
  for (const [k, n] of byDept) summary.addRow([k, n]);
  summary.addRow([]);
  summary.addRow(["Menurut prioritas reviewer", "Jumlah"]).font = { bold: true };
  const byPrio = new Map<string, number>();
  for (const r of rows) {
    const c = priorityCategory(r.weightedScore == null ? null : Number(r.weightedScore), thresholds).label;
    byPrio.set(c, (byPrio.get(c) ?? 0) + 1);
  }
  for (const [k, n] of byPrio) summary.addRow([k, n]);

  // --- Needs Register
  const reg = wb.addWorksheet("Needs Register");
  reg.columns = REGISTER_COLUMNS.map((c) => ({ header: c.header, key: c.key, width: c.width ?? 20 }));
  reg.getRow(1).font = { bold: true };
  reg.views = [{ state: "frozen", ySplit: 1 }];
  for (const r of rows) {
    const obj: Record<string, unknown> = {};
    for (const c of REGISTER_COLUMNS) obj[c.key] = c.get(r, origin);
    reg.addRow(obj);
  }
  reg.getColumn("submittedAt").numFmt = "yyyy-mm-dd hh:mm";
  reg.getColumn("updatedAt").numFmt = "yyyy-mm-dd hh:mm";
  reg.autoFilter = { from: "A1", to: `${String.fromCharCode(64 + REGISTER_COLUMNS.length)}1` };

  // --- Interview Tracker
  const ids = rows.map((r) => r.id);
  const iv = ids.length
    ? await db.query.interviews.findMany({
        where: inArray(interviews.needId, ids),
        with: { need: { columns: { needCode: true, title: true } }, owner: { columns: { fullName: true } } },
        orderBy: (t, { desc }) => [desc(t.scheduledAt)],
      })
    : [];
  const ws = wb.addWorksheet("Interview Tracker");
  ws.columns = [
    { header: "Need ID", key: "code", width: 16 },
    { header: "Judul", key: "title", width: 36 },
    { header: "Tujuan", key: "objective", width: 40 },
    { header: "Jadwal", key: "scheduledAt", width: 18 },
    { header: "Peserta", key: "participants", width: 30 },
    { header: "Temuan", key: "findings", width: 50 },
    { header: "Baseline terverifikasi", key: "verifiedBaseline", width: 30 },
    { header: "Ketergantungan & risiko", key: "dependenciesRisks", width: 30 },
    { header: "Keputusan tindak lanjut", key: "outcome", width: 36 },
    { header: "PJ", key: "owner", width: 22 },
    { header: "Tenggat", key: "dueAt", width: 18 },
    { header: "Status", key: "status", width: 18 },
  ];
  ws.getRow(1).font = { bold: true };
  for (const i of iv) {
    ws.addRow({
      code: i.need.needCode,
      title: i.need.title,
      objective: i.objective,
      scheduledAt: i.scheduledAt,
      participants: i.participants,
      findings: i.findings,
      verifiedBaseline: i.verifiedBaseline,
      dependenciesRisks: i.dependenciesRisks,
      outcome: i.outcome,
      owner: i.owner?.fullName,
      dueAt: i.dueAt,
      status: INTERVIEW_STATUS_LABELS[i.status],
    });
  }

  // --- Scoring
  const sc = wb.addWorksheet("Scoring");
  sc.columns = [
    { header: "Need ID", key: "code", width: 16 },
    { header: "Judul", key: "title", width: 36 },
    ...SCORE_CRITERIA.map((c) => ({ header: `${c.label} (${weights[c.key]}%)`, key: c.key, width: 22 })),
    { header: "Skor berbobot", key: "weighted", width: 14 },
    { header: "Kategori", key: "category", width: 22 },
    { header: "Risiko kritis", key: "critical", width: 12 },
    { header: "Alasan skor", key: "reason", width: 50 },
    { header: "Catatan reviewer", key: "notes", width: 50 },
    { header: "Reviewer", key: "reviewer", width: 22 },
  ];
  sc.getRow(1).font = { bold: true };
  for (const r of rows) {
    const score = r.weightedScore == null ? null : Number(r.weightedScore);
    sc.addRow({
      code: r.needCode,
      title: r.title,
      scoreImpact: r.scoreImpact,
      scoreRisk: r.scoreRisk,
      scoreUrgency: r.scoreUrgency,
      scoreStrategy: r.scoreStrategy,
      scoreReadiness: r.scoreReadiness,
      scoreReuse: r.scoreReuse,
      weighted: score,
      category: priorityCategory(score, thresholds).label,
      critical: r.criticalFlag ? "Ya" : "Tidak",
      reason: r.scoreReason,
      notes: r.reviewerNotes,
      reviewer: r.reviewerName,
    });
  }

  // --- Master Data
  const md = wb.addWorksheet("Master Data");
  md.addRow(["Bagian"]).font = { bold: true };
  md.addRow(["Kode", "Nama", "Aktif"]);
  const depts = await db.select().from(departments).orderBy(departments.code);
  for (const d of depts) md.addRow([d.code, d.name, d.isActive ? "Ya" : "Tidak"]);
  md.addRow([]);
  md.addRow(["Periode assessment"]).font = { bold: true };
  md.addRow(["Nama", "Mulai", "Tenggat", "Status", "Bagian ditetapkan", "Bagian mengisi"]);
  const periods = await db.select().from(assessmentPeriods).orderBy(assessmentPeriods.startAt);
  for (const p of periods) {
    const subs = await db.select({ id: departmentSubmissions.id }).from(departmentSubmissions).where(and(eq(departmentSubmissions.periodId, p.id), ne(departmentSubmissions.status, "draft")));
    const assigned = await db.query.periodDepartments.findMany({ where: (t, { eq }) => eq(t.periodId, p.id), columns: { id: true } });
    md.addRow([p.name, p.startAt, p.dueAt, p.status, assigned.length, subs.length]);
  }
  md.addRow([]);
  md.addRow(["Bobot skor"]).font = { bold: true };
  for (const c of SCORE_CRITERIA) md.addRow([c.label, `${weights[c.key]}%`]);
  md.addRow(["Ambang kategori", `≥${thresholds.veryHigh} sangat tinggi; ≥${thresholds.high} tinggi; ≥${thresholds.medium} menengah`]);
  md.getColumn(1).width = 40;
  md.getColumn(2).width = 40;
  void digitalNeeds;

  return { wb, count: rows.length };
}
