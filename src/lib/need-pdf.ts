import "server-only";
import path from "node:path";
import { existsSync } from "node:fs";
import PDFDocument from "pdfkit";
import type { NeedWithContext } from "@/lib/queries/respond";
import {
  AFFECTED_PARTIES, BENEFITS, DATA_READINESS, DOMAIN_TAGS, FREQUENCY, IMPACTS, INTERVIEW_STATUS_LABELS, NEED_STATUS_LABELS,
  OWNER_READINESS, PROBLEM_FREQUENCY, PROCESS_READINESS, PROPOSED_SOLUTION, SCORE_CRITERIA, URGENCY, USERS_RANGE, WORK_MODE,
  YES_NO_NA, YES_NO_UNKNOWN, labelOf, labelsOf,
} from "@/lib/enums";
import { priorityCategory, scoreBreakdown, type ScoreThresholds, type ScoreWeights } from "@/lib/scoring";
import { formatDate, needCodeLabel } from "@/lib/utils";

type Item = { label: string; value: string | null | undefined; wide?: boolean };
type Section = { title: string; items: Item[] };

export type NeedPdfOptions = {
  /** Staf/manajemen melihat hasil review, skor, dan seluruh wawancara; responden hanya yang dibagikan. */
  audience: "staff" | "respondent";
  weights: ScoreWeights;
  thresholds: ScoreThresholds;
  printedBy: string;
};

const COLOR = { primary: "#0f4c81", text: "#1f2937", muted: "#6b7280", border: "#d1d5db", band: "#eef4fa" };
const MARGIN = 48;

/** Font standar PDF memakai WinAnsi; ganti simbol yang tidak tersedia agar tidak tercetak sebagai karakter rusak. */
function clean(s: string) {
  return s.replace(/→/g, "->").replace(/≥/g, ">=").replace(/≤/g, "<=").replace(/[^\S\n]+\n/g, "\n");
}

function withDetail(label: string, detail: string | null) {
  return detail ? `${label} — ${detail}` : label;
}

function metric(n: NeedWithContext) {
  if (!n.metricName && n.baselineValue == null && n.targetValue == null) return null;
  const num = (v: number | null) => (v == null ? "?" : v.toLocaleString("id-ID"));
  const unit = n.metricUnit ? ` ${n.metricUnit}` : "";
  return `${n.metricName ?? "Ukuran belum disebutkan"}: ${num(n.baselineValue)}${unit} saat ini -> target ${num(n.targetValue)}${unit}`;
}

function formASection(sub: NeedWithContext["submission"], title = "Profil Bagian (Form A)"): Section {
  return {
    title,
    items: [
      { label: "Responden", value: `${sub.respondentName ?? sub.respondent?.fullName ?? "-"}${sub.respondentJobTitle ? ` · ${sub.respondentJobTitle}` : ""}` },
      { label: "Pemilik proses", value: sub.processOwnerName },
      { label: "Pengguna terlibat", value: labelOf(USERS_RANGE, sub.estimatedUsersRange) },
      { label: "Cara kerja dominan", value: labelOf(WORK_MODE, sub.dominantWorkMode) },
      { label: "Proses utama", value: sub.mainProcesses, wide: true },
      { label: "Sistem saat ini", value: sub.currentSystems, wide: true },
    ],
  };
}

function sections(need: NeedWithContext, opts: NeedPdfOptions, withFormA = true): Section[] {
  const out: Section[] = [
    ...(withFormA ? [formASection(need.submission)] : []),
    {
      title: "1 · Identitas dan konteks",
      items: [
        { label: "Proses bisnis terkait", value: need.businessProcess, wide: true },
        { label: "Pemilik proses", value: need.processOwner },
        { label: "Frekuensi proses", value: labelOf(FREQUENCY, need.frequency) },
        { label: "Pihak terdampak", value: labelsOf(AFFECTED_PARTIES, need.affectedParties), wide: true },
        { label: "Perkiraan volume", value: need.estimatedVolume, wide: true },
      ],
    },
    {
      title: "2 · Masalah saat ini",
      items: [
        { label: "Masalah yang terjadi", value: need.problemDescription, wide: true },
        { label: "Proses saat ini", value: need.currentProcess, wide: true },
        { label: "Dampak masalah", value: labelsOf(IMPACTS, need.impacts), wide: true },
        { label: "Frekuensi masalah", value: labelOf(PROBLEM_FREQUENCY, need.problemFrequency) },
        { label: "Bukti pendukung", value: labelOf(YES_NO_NA, need.evidenceAvailable) },
        ...(need.consequenceIfUnresolved ? [{ label: "Dampak jika tidak ditangani (isian lama)", value: need.consequenceIfUnresolved, wide: true }] : []),
      ],
    },
    {
      title: "3 · Kebutuhan dan solusi",
      items: [
        { label: "Hasil yang ingin dicapai", value: need.desiredOutcome, wide: true },
        { label: "Usulan solusi", value: labelsOf(PROPOSED_SOLUTION, need.proposedSolution), wide: true },
        { label: "Terkait sistem yang ada", value: withDetail(labelOf(YES_NO_UNKNOWN, need.existingSystemRelation), need.existingSystemDetail), wide: true },
        { label: "Data yang diperlukan / dihasilkan", value: need.dataRequired, wide: true },
        { label: "Pertukaran data lintas Bagian / sistem", value: withDetail(labelOf(YES_NO_UNKNOWN, need.integrationRequired), need.integrationDetail), wide: true },
        { label: "Data sensitif / kritis", value: withDetail(labelOf(YES_NO_UNKNOWN, need.sensitiveDataFlag), need.sensitiveDataDetail), wide: true },
        { label: "Akses lapangan / mobile", value: labelOf(YES_NO_UNKNOWN, need.mobileFieldNeed) },
        { label: "Domain KINRA (diisi reviewer)", value: labelsOf(DOMAIN_TAGS, need.domainTags) },
      ],
    },
    {
      title: "4 · Manfaat, urgensi, dan kesiapan",
      items: [
        ...(need.expectedBenefits.length > 0 ? [{ label: "Manfaat yang diharapkan", value: labelsOf(BENEFITS, need.expectedBenefits), wide: true }] : []),
        { label: "Urgensi menurut Bagian", value: labelOf(URGENCY, need.respondentUrgency) },
        { label: "Tenggat eksternal", value: need.externalDeadline },
        { label: "Ukuran keberhasilan", value: metric(need), wide: true },
        { label: "Keterangan kondisi saat ini", value: need.baseline, wide: true },
        ...(need.target ? [{ label: "Target (isian lama)", value: need.target, wide: true }] : []),
        { label: "Alasan urgensi & akibat bila tidak ditangani", value: need.urgencyReason, wide: true },
        { label: "Kesiapan data", value: labelOf(DATA_READINESS, need.dataReadiness) },
        { label: "Kesiapan proses / SOP", value: labelOf(PROCESS_READINESS, need.processReadiness) },
        { label: "Ketersediaan pemilik proses", value: labelOf(OWNER_READINESS, need.ownerReadiness) },
        { label: "Perkiraan biaya", value: need.estimatedCost },
        { label: "Ketergantungan", value: need.dependencies, wide: true },
        { label: "Catatan tambahan", value: need.additionalNotes, wide: true },
      ],
    },
  ];

  if (opts.audience === "staff" && need.review) {
    const score = need.review.weightedScore == null ? null : Number(need.review.weightedScore);
    out.push({
      title: "Hasil review dan skor",
      items: [
        { label: "Skor berbobot", value: score == null ? "-" : `${score.toFixed(2)} (${priorityCategory(score, opts.thresholds).label})` },
        { label: "Reviewer", value: need.review.reviewer?.fullName },
        ...scoreBreakdown(need.review, opts.weights).map((b) => ({
          label: SCORE_CRITERIA.find((c) => c.key === b.key)?.label ?? b.key,
          value: b.value == null ? "-" : `${b.value}/5 × ${b.weight}% = ${b.contribution}`,
        })),
        ...(need.review.criticalFlag ? [{ label: "Risiko kritis", value: need.review.criticalReason || "Ya", wide: true }] : []),
        { label: "Alasan skor", value: need.review.scoreReason, wide: true },
        { label: "Catatan reviewer", value: need.review.reviewerNotes, wide: true },
      ],
    });
  }

  const interviews = opts.audience === "staff" ? need.interviews : need.interviews.filter((i) => i.sharedWithRespondent);
  interviews.forEach((i, idx) => {
    out.push({
      title: `Wawancara ${interviews.length > 1 ? idx + 1 : ""}`.trim(),
      items: [
        { label: "Jadwal", value: formatDate(i.scheduledAt, true) },
        { label: "Status", value: INTERVIEW_STATUS_LABELS[i.status] },
        { label: "Tujuan", value: i.objective, wide: true },
        { label: "Peserta", value: i.participants, wide: true },
        ...(opts.audience === "staff"
          ? [
              { label: "Temuan", value: i.findings, wide: true },
              { label: "Baseline terverifikasi", value: i.verifiedBaseline, wide: true },
              { label: "Ketergantungan & risiko", value: i.dependenciesRisks, wide: true },
              { label: "PJ", value: i.owner?.fullName },
              { label: "Tenggat", value: formatDate(i.dueAt) },
            ]
          : []),
        { label: "Keputusan tindak lanjut", value: i.outcome, wide: true },
      ],
    });
  });

  const files = need.attachments.filter((a) => !a.archivedAt);
  if (files.length > 0) {
    out.push({
      title: "Lampiran",
      items: files.map((a, idx) => ({ label: `${idx + 1}.`, value: `${a.originalFilename} (${Math.max(1, Math.round(a.sizeBytes / 1024))} KB)`, wide: true })),
    });
  }
  return out;
}

type Column = { header: string; ratio: number; align?: "left" | "right" | "center" };

/** Primitif tata letak bersama untuk cetak satu kebutuhan maupun laporan. */
function createWriter(title: string) {
  const doc = new PDFDocument({
    size: "A4",
    margins: { top: MARGIN, bottom: MARGIN + 14, left: MARGIN, right: MARGIN },
    bufferPages: true,
    info: { Title: clean(title), Author: "KINRA DNA", Creator: "KINRA Digitalization Needs Assessment" },
  });
  const chunks: Buffer[] = [];
  doc.on("data", (c: Buffer) => chunks.push(c));
  const done = new Promise<Buffer>((resolve, reject) => {
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
  });

  const left = MARGIN;
  const width = doc.page.width - MARGIN * 2;
  const bottomLimit = () => doc.page.height - doc.page.margins.bottom;
  const ensure = (h: number) => {
    if (doc.y + h > bottomLimit()) doc.addPage();
  };
  const gutter = 16;
  const halfW = (width - gutter) / 2;

  const itemHeight = (it: Item, w: number) => {
    doc.font("Helvetica").fontSize(7.5);
    const lh = doc.heightOfString(clean(it.label), { width: w });
    doc.font("Helvetica").fontSize(9);
    return lh + 2 + doc.heightOfString(clean(it.value || "-"), { width: w });
  };
  const drawItem = (it: Item, x: number, y: number, w: number) => {
    doc.font("Helvetica").fontSize(7.5).fillColor(COLOR.muted).text(clean(it.label), x, y, { width: w });
    doc.font("Helvetica").fontSize(9).fillColor(it.value ? COLOR.text : COLOR.muted).text(clean(it.value || "-"), x, doc.y + 2, { width: w });
  };

  const w = {
    doc,
    left,
    width,
    ensure,

    kop(label: string) {
      const logo = path.join(process.cwd(), "public", "kinra-logo.png");
      const top = doc.y;
      if (existsSync(logo)) doc.image(logo, left, top, { height: 34 });
      doc.font("Helvetica-Bold").fontSize(9).fillColor(COLOR.muted).text(label, left, top + 4, { width, align: "right" });
      doc.font("Helvetica").fontSize(8).text("KINRA Digitalization Needs Assessment", left, doc.y, { width, align: "right" });
      doc.y = top + 44;
      doc.moveTo(left, doc.y).lineTo(left + width, doc.y).lineWidth(1.5).strokeColor(COLOR.primary).stroke();
      doc.moveDown(0.8);
    },

    /** Pita berisi pasangan label-nilai; lebar kolom mengikuti rasio. */
    band(meta: [string, string][], ratios: number[]) {
      const top = doc.y;
      doc.font("Helvetica-Bold").fontSize(8.5);
      const h = 24 + Math.max(...meta.map(([, v], i) => doc.heightOfString(clean(v), { width: width * ratios[i] - 12 })));
      doc.rect(left, top, width, h).fill(COLOR.band);
      let x = left + 8;
      meta.forEach(([k, v], i) => {
        const cw = width * ratios[i] - 12;
        doc.font("Helvetica").fontSize(7).fillColor(COLOR.muted).text(k.toUpperCase(), x, top + 6, { width: cw });
        doc.font("Helvetica-Bold").fontSize(8.5).fillColor(COLOR.text).text(clean(v), x, top + 16, { width: cw });
        x += width * ratios[i];
      });
      doc.y = top + h;
      doc.x = left;
    },

    heading(text: string) {
      doc.moveDown(1);
      ensure(40);
      const y = doc.y;
      doc.rect(left, y, 3, 14).fill(COLOR.primary);
      doc.font("Helvetica-Bold").fontSize(11).fillColor(COLOR.primary).text(clean(text), left + 10, y + 1.5, { width: width - 10 });
      doc.y = y + 20;
      doc.x = left;
    },

    section(s: Section) {
      w.heading(s.title);
      // Isian pendek dipasangkan dua kolom; isian panjang memakai satu baris penuh.
      const rows: Item[][] = [];
      for (const it of s.items) {
        const last = rows[rows.length - 1];
        if (!it.wide && last && last.length === 1 && !last[0].wide) last.push(it);
        else rows.push([it]);
      }
      for (const row of rows) {
        const cw = row.length === 1 && row[0].wide ? width : halfW;
        const h = Math.max(...row.map((it) => itemHeight(it, cw)));
        // Isian sangat panjang boleh terpotong ke halaman berikutnya; selain itu jaga utuh satu baris.
        if (h < bottomLimit() - doc.page.margins.top) ensure(h + 8);
        const rowTop = doc.y;
        let maxY = rowTop;
        row.forEach((it, i) => {
          drawItem(it, left + i * (halfW + gutter), rowTop, cw);
          maxY = doc.y < rowTop ? doc.y : Math.max(maxY, doc.y); // pindah halaman di tengah isian
        });
        doc.x = left;
        doc.y = maxY + 8;
      }
    },

    /** Tabel sederhana; header diulang bila tabel berlanjut ke halaman berikutnya. */
    table(cols: Column[], rows: string[][]) {
      const pad = 4;
      const drawHeader = () => {
        doc.font("Helvetica-Bold").fontSize(7.5);
        const h = pad * 2 + Math.max(...cols.map((c) => doc.heightOfString(c.header, { width: width * c.ratio - pad * 2 })));
        ensure(h + 20);
        const y = doc.y;
        doc.rect(left, y, width, h).fill(COLOR.band);
        let x = left;
        for (const c of cols) {
          doc.fillColor(COLOR.primary).text(c.header, x + pad, y + pad, { width: width * c.ratio - pad * 2, align: c.align ?? "left" });
          x += width * c.ratio;
        }
        doc.y = y + h;
      };
      drawHeader();
      for (const r of rows) {
        doc.font("Helvetica").fontSize(8.5);
        const h = pad * 2 + Math.max(...cols.map((c, i) => doc.heightOfString(clean(r[i] || "-"), { width: width * c.ratio - pad * 2 })));
        if (doc.y + h > bottomLimit()) {
          doc.addPage();
          drawHeader();
          doc.font("Helvetica").fontSize(8.5);
        }
        const y = doc.y;
        let x = left;
        cols.forEach((c, i) => {
          doc.fillColor(r[i] ? COLOR.text : COLOR.muted).text(clean(r[i] || "-"), x + pad, y + pad, { width: width * c.ratio - pad * 2, align: c.align ?? "left" });
          x += width * c.ratio;
        });
        doc.moveTo(left, y + h).lineTo(left + width, y + h).lineWidth(0.5).strokeColor(COLOR.border).stroke();
        doc.y = y + h;
      }
      doc.x = left;
    },

    /** Judul kebutuhan beserta pita meta; dipakai di awal tiap kebutuhan. */
    needHeader(need: NeedWithContext, opts: NeedPdfOptions) {
      doc.font("Helvetica-Bold").fontSize(10).fillColor(COLOR.primary).text(needCodeLabel(need.needCode), left, doc.y, { width });
      doc.font("Helvetica-Bold").fontSize(15).fillColor(COLOR.text).text(clean(need.title || "(tanpa judul)"), { width });
      doc.moveDown(0.4);
      const sub = need.submission;
      // Bagian dan periode cenderung panjang; beri kolom lebih lebar.
      w.band(
        [
          ["Bagian", sub.department.name],
          ["Periode", sub.period.name],
          ["Status", NEED_STATUS_LABELS[need.status] ?? need.status],
          ["Dikirim", formatDate(need.submittedAt, true)],
          ["Diperbarui", formatDate(need.updatedAt, true)],
        ],
        [0.3, 0.25, 0.15, 0.15, 0.15],
      );
      if (opts.audience === "respondent" && need.statusReason && ["returned_for_revision", "clarification_required", "deferred", "rejected"].includes(need.status)) {
        doc.moveDown(0.6);
        doc.font("Helvetica-Bold").fontSize(8.5).fillColor(COLOR.primary).text("Catatan Tim Assessment: ", left, doc.y, { width, continued: true });
        doc.font("Helvetica").fillColor(COLOR.text).text(clean(need.statusReason));
      }
    },

    finish(footer: string) {
      const range = doc.bufferedPageRange();
      for (let i = range.start; i < range.start + range.count; i++) {
        doc.switchToPage(i);
        const y = doc.page.height - MARGIN + 2;
        doc.page.margins.bottom = 0;
        doc.moveTo(left, y - 6).lineTo(left + width, y - 6).lineWidth(0.5).strokeColor(COLOR.border).stroke();
        doc.font("Helvetica").fontSize(7.5).fillColor(COLOR.muted);
        doc.text(clean(footer), left, y, { width: width - 60, lineBreak: false });
        doc.text(`Hal. ${i - range.start + 1} / ${range.count}`, left + width - 60, y, { width: 60, align: "right", lineBreak: false });
      }
      doc.end();
      return done;
    },
  };
  return w;
}

const printedLine = (by: string) => `Dicetak ${formatDate(new Date(), true)} oleh ${by}`;

/** Membuat dokumen PDF satu kebutuhan digital; mengembalikan buffer siap unduh. */
export function renderNeedPdf(need: NeedWithContext, opts: NeedPdfOptions): Promise<Buffer> {
  const w = createWriter(`${needCodeLabel(need.needCode)} — ${need.title || "(tanpa judul)"}`);
  w.kop("FORMULIR KEBUTUHAN DIGITAL");
  w.needHeader(need, opts);
  for (const s of sections(need, opts)) w.section(s);
  return w.finish(`${needCodeLabel(need.needCode)} · ${printedLine(opts.printedBy)}`);
}

export type NeedsReportOptions = NeedPdfOptions & {
  /** Ringkasan filter yang dipakai, ditampilkan di halaman sampul. */
  filterSummary: string;
};

const URGENCY_ORDER = ["critical", "high", "medium", "low"];

/** Laporan seluruh kebutuhan (sesuai filter) dikelompokkan per Bagian: ringkasan lalu detail lengkap tiap kebutuhan. */
export function renderNeedsReportPdf(needs: NeedWithContext[], opts: NeedsReportOptions): Promise<Buffer> {
  const w = createWriter("Laporan Kebutuhan Digital per Bagian");
  const { doc } = w;
  const scoreOf = (n: NeedWithContext) => (n.review?.weightedScore == null ? null : Number(n.review.weightedScore));
  const scoreText = (n: NeedWithContext) => {
    const s = scoreOf(n);
    return s == null ? "-" : `${s.toFixed(0)} · ${priorityCategory(s, opts.thresholds).label}`;
  };

  // Kelompokkan per Bagian dengan urutan nama; urutan kebutuhan dalam Bagian mengikuti urutan masukan.
  const groups = new Map<string, { name: string; needs: NeedWithContext[] }>();
  for (const n of needs) {
    const d = n.submission.department;
    if (!groups.has(d.id)) groups.set(d.id, { name: d.name, needs: [] });
    groups.get(d.id)!.needs.push(n);
  }
  const ordered = [...groups.values()].sort((a, b) => a.name.localeCompare(b.name, "id"));
  const showScore = opts.audience === "staff";

  // --- Sampul & ringkasan
  w.kop("LAPORAN KEBUTUHAN DIGITAL");
  doc.font("Helvetica-Bold").fontSize(16).fillColor(COLOR.text).text("Ringkasan Kebutuhan Digital per Bagian", w.left, doc.y, { width: w.width });
  doc.font("Helvetica").fontSize(8.5).fillColor(COLOR.muted).text(clean(`Filter: ${opts.filterSummary}`), { width: w.width });
  doc.moveDown(0.6);

  const scored = needs.filter((n) => scoreOf(n) != null);
  const urgentCount = needs.filter((n) => n.respondentUrgency === "critical" || n.respondentUrgency === "high").length;
  w.band(
    [
      ["Total kebutuhan", String(needs.length)],
      ["Bagian", String(ordered.length)],
      ["Urgensi kritis/tinggi", String(urgentCount)],
      ...(showScore
        ? ([
            ["Sudah dinilai", String(scored.length)],
            ["Risiko kritis", String(needs.filter((n) => n.review?.criticalFlag).length)],
          ] as [string, string][])
        : []),
    ],
    showScore ? [0.2, 0.2, 0.2, 0.2, 0.2] : [1 / 3, 1 / 3, 1 / 3],
  );

  if (needs.length === 0) {
    doc.moveDown(1.5);
    doc.font("Helvetica").fontSize(10).fillColor(COLOR.muted).text("Tidak ada kebutuhan yang cocok dengan filter.", w.left, doc.y, { width: w.width });
    return w.finish(`Laporan Kebutuhan Digital · ${printedLine(opts.printedBy)}`);
  }

  const avg = (xs: number[]) => (xs.length ? (xs.reduce((a, b) => a + b, 0) / xs.length).toFixed(1) : "-");
  w.heading("Ringkasan per Bagian");
  w.table(
    [
      { header: "Bagian", ratio: showScore ? 0.38 : 0.54 },
      { header: "Jumlah", ratio: 0.1, align: "right" },
      ...URGENCY_ORDER.map((u) => ({ header: `Urgensi ${labelOf(URGENCY, u).toLowerCase()}`, ratio: 0.09, align: "right" as const })),
      ...(showScore ? [{ header: "Rata-rata skor", ratio: 0.16, align: "right" as const }] : []),
    ],
    [
      ...ordered.map((g) => [
        g.name,
        String(g.needs.length),
        ...URGENCY_ORDER.map((u) => String(g.needs.filter((n) => n.respondentUrgency === u).length)),
        ...(showScore ? [avg(g.needs.map(scoreOf).filter((s): s is number => s != null))] : []),
      ]),
      [
        "TOTAL",
        String(needs.length),
        ...URGENCY_ORDER.map((u) => String(needs.filter((n) => n.respondentUrgency === u).length)),
        ...(showScore ? [avg(scored.map((n) => scoreOf(n)!))] : []),
      ],
    ],
  );

  const statusCounts = new Map<string, number>();
  for (const n of needs) statusCounts.set(n.status, (statusCounts.get(n.status) ?? 0) + 1);
  w.heading("Ringkasan per status");
  w.table(
    [
      { header: "Status", ratio: 0.8 },
      { header: "Jumlah", ratio: 0.2, align: "right" },
    ],
    Object.keys(NEED_STATUS_LABELS)
      .filter((k) => statusCounts.has(k))
      .map((k) => [NEED_STATUS_LABELS[k], String(statusCounts.get(k))]),
  );

  // --- Per Bagian
  ordered.forEach((g, gi) => {
    doc.addPage();
    doc.font("Helvetica-Bold").fontSize(9).fillColor(COLOR.muted).text(`BAGIAN ${gi + 1} DARI ${ordered.length}`, w.left, doc.y, { width: w.width });
    doc.font("Helvetica-Bold").fontSize(17).fillColor(COLOR.primary).text(clean(g.name), { width: w.width });
    doc.moveTo(w.left, doc.y + 4).lineTo(w.left + w.width, doc.y + 4).lineWidth(1.5).strokeColor(COLOR.primary).stroke();
    doc.y += 6;

    // Form A diisi per periode; tampilkan sekali untuk tiap periode di Bagian ini.
    const subs = new Map<string, NeedWithContext["submission"]>();
    for (const n of g.needs) subs.set(n.submission.id, n.submission);
    for (const sub of subs.values()) w.section(formASection(sub, subs.size > 1 ? `Profil Bagian (Form A) · ${sub.period.name}` : "Profil Bagian (Form A)"));

    w.heading(`Daftar kebutuhan (${g.needs.length})`);
    w.table(
      [
        { header: "Kode", ratio: 0.16 },
        { header: "Judul", ratio: showScore ? 0.36 : 0.5 },
        { header: "Urgensi", ratio: 0.12 },
        { header: "Status", ratio: 0.22 },
        ...(showScore ? [{ header: "Skor", ratio: 0.14 }] : []),
      ],
      g.needs.map((n) => [
        needCodeLabel(n.needCode),
        n.title || "(tanpa judul)",
        labelOf(URGENCY, n.respondentUrgency),
        NEED_STATUS_LABELS[n.status] ?? n.status,
        ...(showScore ? [scoreText(n)] : []),
      ]),
    );

    for (const n of g.needs) {
      doc.addPage();
      w.needHeader(n, opts);
      for (const s of sections(n, opts, false)) w.section(s);
    }
  });

  return w.finish(`Laporan Kebutuhan Digital · ${printedLine(opts.printedBy)}`);
}
