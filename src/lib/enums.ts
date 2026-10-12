/**
 * Daftar pilihan dan label Bahasa Indonesia untuk formulir, filter, dan laporan.
 * Nilai (value) disimpan di database; label hanya untuk tampilan.
 */

export type Option = { value: string; label: string; hint?: string };

export const ROLE_LABELS: Record<string, string> = {
  admin: "Administrator TI",
  respondent: "Kepala Bagian / Responden",
  assessment_reviewer: "Tim Assessment TI",
  management_viewer: "Manajemen / Reviewer",
};

export const PERIOD_STATUS_LABELS: Record<string, string> = {
  draft: "Draft",
  active: "Aktif",
  closed: "Ditutup",
};

export const SUBMISSION_STATUS_LABELS: Record<string, string> = {
  draft: "Draft",
  submitted: "Dikirim",
  returned: "Dikembalikan",
  reviewed: "Ditelaah",
};

export const NEED_STATUS_LABELS: Record<string, string> = {
  draft: "Draft",
  submitted: "Submitted",
  under_review: "Under Review",
  clarification_required: "Clarification Required",
  interview_scheduled: "Interview Scheduled",
  interview_completed: "Interview Completed",
  validated: "Validated",
  prioritized: "Prioritized",
  deferred: "Deferred",
  rejected: "Rejected / Not Pursued",
  returned_for_revision: "Returned for Revision",
  closed: "Closed",
  archived: "Archived / Void",
};

export const NEED_STATUS_TONE: Record<string, string> = {
  draft: "gray",
  submitted: "blue",
  under_review: "indigo",
  clarification_required: "amber",
  interview_scheduled: "violet",
  interview_completed: "violet",
  validated: "teal",
  prioritized: "green",
  deferred: "orange",
  rejected: "red",
  returned_for_revision: "amber",
  closed: "gray",
  archived: "gray",
};

export const INTERVIEW_STATUS_LABELS: Record<string, string> = {
  planned: "Direncanakan",
  scheduled: "Dijadwalkan",
  completed: "Selesai",
  follow_up_required: "Perlu Tindak Lanjut",
};

export const USERS_RANGE: Option[] = [
  { value: "1-5", label: "1–5 orang" },
  { value: "6-20", label: "6–20 orang" },
  { value: "21-50", label: "21–50 orang" },
  { value: "51-100", label: "51–100 orang" },
  { value: ">100", label: "Lebih dari 100 orang" },
];

export const WORK_MODE: Option[] = [
  { value: "integrated_app", label: "Aplikasi terintegrasi" },
  { value: "separate_apps", label: "Aplikasi terpisah" },
  { value: "spreadsheet", label: "Spreadsheet" },
  { value: "manual", label: "Dokumen / manual" },
  { value: "mixed", label: "Kombinasi" },
];

export const AFFECTED_PARTIES: Option[] = [
  { value: "internal", label: "Internal" },
  { value: "tenant", label: "Tenant" },
  { value: "investor", label: "Investor" },
  { value: "vendor", label: "Vendor" },
  { value: "regulator", label: "Regulator" },
  { value: "community", label: "Masyarakat / lingkungan" },
  { value: "other", label: "Lainnya" },
];

export const FREQUENCY: Option[] = [
  { value: "daily", label: "Harian" },
  { value: "weekly", label: "Mingguan" },
  { value: "monthly", label: "Bulanan" },
  { value: "yearly", label: "Tahunan" },
  { value: "adhoc", label: "Ad hoc" },
  { value: "realtime", label: "Real-time" },
];

export const IMPACTS: Option[] = [
  { value: "time", label: "Waktu" },
  { value: "cost", label: "Biaya" },
  { value: "revenue", label: "Pendapatan" },
  { value: "tenant_service", label: "Layanan tenant / investor" },
  { value: "data_quality", label: "Kualitas data" },
  { value: "risk_compliance", label: "Risiko / kepatuhan" },
  { value: "safety_env", label: "Keselamatan / lingkungan" },
  { value: "control_audit", label: "Kontrol / audit" },
  { value: "decision", label: "Keputusan manajemen" },
  { value: "other", label: "Lainnya" },
];

export const PROBLEM_FREQUENCY: Option[] = [
  { value: "rare", label: "Jarang" },
  { value: "monthly", label: "Bulanan" },
  { value: "weekly", label: "Mingguan" },
  { value: "daily", label: "Harian" },
  { value: "every_transaction", label: "Hampir setiap transaksi" },
];

export const YES_NO_NA: Option[] = [
  { value: "yes", label: "Ya" },
  { value: "no", label: "Tidak" },
  { value: "unavailable", label: "Belum tersedia" },
];

export const YES_NO_UNKNOWN: Option[] = [
  { value: "yes", label: "Ya" },
  { value: "no", label: "Tidak" },
  { value: "unknown", label: "Tidak tahu" },
];

export const PROPOSED_SOLUTION: Option[] = [
  { value: "application", label: "Aplikasi" },
  { value: "automation", label: "Otomasi" },
  { value: "integration", label: "Integrasi" },
  { value: "dashboard", label: "Dashboard / analitik" },
  { value: "mobile", label: "Mobile" },
  { value: "iot", label: "IoT / sensor" },
  { value: "sop", label: "Perbaikan SOP" },
  { value: "training", label: "Pelatihan" },
  { value: "unknown", label: "Belum tahu" },
  { value: "other", label: "Lainnya" },
];

export const DOMAIN_TAGS: Option[] = [
  { value: "tenant", label: "Tenant" },
  { value: "investor", label: "Investor" },
  { value: "utility", label: "Utilitas" },
  { value: "estate", label: "Kawasan" },
  { value: "asset", label: "Aset" },
  { value: "infrastructure", label: "Infrastruktur" },
  { value: "governance_finance", label: "Corporate governance, finance & reporting" },
  { value: "procurement", label: "Procurement & vendor management" },
  { value: "ehs", label: "Environment, health, safety & compliance" },
  { value: "hr_admin", label: "Human resources & administration" },
  { value: "it_cyber_data", label: "IT operations, cyber security & data" },
  { value: "risk_control", label: "Risk management & internal control" },
  { value: "executive", label: "Executive reporting & decision support" },
  { value: "other", label: "Other / cross-functional" },
];

export const BENEFITS: Option[] = [
  { value: "reduce_time", label: "Mengurangi waktu" },
  { value: "reduce_cost", label: "Mengurangi biaya" },
  { value: "increase_revenue", label: "Meningkatkan pendapatan / penagihan" },
  { value: "improve_service", label: "Meningkatkan layanan" },
  { value: "control_compliance", label: "Memperkuat kontrol / kepatuhan" },
  { value: "reduce_risk", label: "Mengurangi risiko" },
  { value: "data_quality", label: "Meningkatkan kualitas data" },
  { value: "safety_env", label: "Meningkatkan keselamatan / lingkungan" },
  { value: "faster_decision", label: "Mempercepat keputusan" },
  { value: "other", label: "Lainnya" },
];

export const URGENCY: Option[] = [
  { value: "low", label: "Rendah" },
  { value: "medium", label: "Sedang" },
  { value: "high", label: "Tinggi" },
  { value: "critical", label: "Kritis" },
];

export const DATA_READINESS: Option[] = [
  { value: "ready", label: "Siap" },
  { value: "partial", label: "Sebagian" },
  { value: "not_ready", label: "Belum" },
  { value: "unknown", label: "Tidak tahu" },
];

export const PROCESS_READINESS: Option[] = [
  { value: "defined", label: "Terdefinisi" },
  { value: "partial", label: "Sebagian" },
  { value: "not_defined", label: "Belum" },
  { value: "unknown", label: "Tidak tahu" },
];

export const OWNER_READINESS: Option[] = [
  { value: "ready", label: "Siap" },
  { value: "limited", label: "Terbatas" },
  { value: "not_assigned", label: "Belum ditetapkan" },
];

// Form C
export const COMPLETENESS: Option[] = [
  { value: "complete", label: "Lengkap" },
  { value: "needs_clarification", label: "Perlu klarifikasi" },
];

export const ROOT_CAUSE: Option[] = [
  { value: "yes", label: "Ya" },
  { value: "partial", label: "Sebagian" },
  { value: "no", label: "Belum" },
];

export const DUPLICATE_STATUS: Option[] = [
  { value: "no", label: "Tidak" },
  { value: "maybe", label: "Mungkin" },
  { value: "yes", label: "Ya" },
];

export const SOLUTION_CATEGORY: Option[] = [
  { value: "process_sop", label: "Process / SOP" },
  { value: "configuration", label: "Configuration" },
  { value: "integration", label: "Integration" },
  { value: "automation", label: "Automation" },
  { value: "reporting_bi", label: "Reporting / BI" },
  { value: "new_application", label: "New application" },
  { value: "infrastructure_iot", label: "Infrastructure / IoT" },
  { value: "data_governance", label: "Data governance" },
  { value: "security_risk", label: "Security / risk" },
  { value: "training_change", label: "Training / change" },
  { value: "defer_no_tech", label: "Defer / no technology" },
];

export const STRATEGIC_ALIGNMENT: Option[] = [
  { value: "clear", label: "Jelas" },
  { value: "partial", label: "Sebagian" },
  { value: "not_assessed", label: "Belum dinilai" },
];

export const DELAY_RISK: Option[] = URGENCY;

export const FOLLOW_UP: Option[] = [
  { value: "no_interview", label: "Tanpa wawancara" },
  { value: "interview", label: "Wawancara" },
  { value: "more_evidence", label: "Bukti tambahan" },
  { value: "workshop", label: "Workshop lintas Bagian" },
];

export const SCORE_CRITERIA: { key: ScoreKey; label: string; hint: string }[] = [
  { key: "scoreImpact", label: "Dampak bisnis / layanan", hint: "1 = dampak minor lokal; 5 = dampak besar pada layanan inti / pendapatan." },
  { key: "scoreRisk", label: "Risiko, kepatuhan, keselamatan, kontinuitas", hint: "1 = tidak ada eksposur; 5 = eksposur hukum / keselamatan / kontinuitas material." },
  { key: "scoreUrgency", label: "Urgensi / tenggat", hint: "1 = tidak ada tenggat; 5 = tenggat eksternal < 3 bulan." },
  { key: "scoreStrategy", label: "Kesesuaian strategi / RSTI", hint: "1 = tidak terkait; 5 = inisiatif eksplisit dalam RSTI." },
  { key: "scoreReadiness", label: "Kesiapan proses, data, dan pemilik", hint: "1 = belum ada SOP / data / owner; 5 = semuanya siap." },
  { key: "scoreReuse", label: "Potensi reuse / integrasi lintas Bagian", hint: "1 = spesifik satu Bagian; 5 = dapat dipakai banyak Bagian." },
];

export type ScoreKey =
  | "scoreImpact"
  | "scoreRisk"
  | "scoreUrgency"
  | "scoreStrategy"
  | "scoreReadiness"
  | "scoreReuse";

export function labelOf(options: Option[], value: string | null | undefined) {
  if (!value) return "-";
  return options.find((o) => o.value === value)?.label ?? value;
}

export function labelsOf(options: Option[], values: string[] | null | undefined) {
  if (!values || values.length === 0) return "-";
  return values.map((v) => labelOf(options, v)).join(", ");
}
