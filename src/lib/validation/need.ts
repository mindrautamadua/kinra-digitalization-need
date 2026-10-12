import { z } from "zod";
import {
  AFFECTED_PARTIES, DATA_READINESS, FREQUENCY, IMPACTS, OWNER_READINESS,
  PROBLEM_FREQUENCY, PROCESS_READINESS, PROPOSED_SOLUTION, URGENCY, USERS_RANGE, WORK_MODE, YES_NO_NA, YES_NO_UNKNOWN,
} from "@/lib/enums";

const vals = (o: { value: string }[]) => o.map((x) => x.value) as [string, ...string[]];
const optStr = (max: number) => z.string().trim().max(max, `Maksimal ${max} karakter.`).optional().or(z.literal("")).transform((v) => (v ? v : null));
const optEnum = (o: { value: string }[]) => z.enum(vals(o)).optional().or(z.literal("")).transform((v) => (v ? v : null));
const arr = (o: { value: string }[]) => z.array(z.enum(vals(o))).default([]);
/** Angka opsional; koma diterima sebagai pemisah desimal. */
const optNum = z
  .string()
  .trim()
  .optional()
  .transform((v) => (v ? Number(v.replace(",", ".")) : null))
  .refine((v) => v == null || Number.isFinite(v), "Isi dengan angka.");

export const SHORT = 200;
export const LONG = 4000;

/** Form A — profil Bagian */
export const profileSchema = z.object({
  respondentName: z.string().trim().min(1, "Nama responden wajib diisi.").max(SHORT),
  respondentJobTitle: z.string().trim().min(1, "Jabatan responden wajib diisi.").max(SHORT),
  processOwnerName: z.string().trim().min(1, "Nama pejabat / pemilik proses wajib diisi.").max(SHORT),
  estimatedUsersRange: optEnum(USERS_RANGE),
  mainProcesses: z.string().trim().min(1, "Proses utama Bagian wajib diisi.").max(LONG),
  mainServices: optStr(LONG),
  currentSystems: optStr(LONG),
  dominantWorkMode: optEnum(WORK_MODE),
  attestation: z.boolean(),
});
export type ProfileInput = z.infer<typeof profileSchema>;

/** Form B — draft: semua opsional, hanya validasi tipe/panjang. */
export const needDraftSchema = z.object({
  title: z.string().trim().max(SHORT).default(""),
  businessProcess: optStr(LONG),
  processOwner: optStr(SHORT),
  affectedParties: arr(AFFECTED_PARTIES),
  frequency: optEnum(FREQUENCY),
  estimatedVolume: optStr(SHORT),
  problemDescription: optStr(LONG),
  currentProcess: optStr(LONG),
  impacts: arr(IMPACTS),
  problemFrequency: optEnum(PROBLEM_FREQUENCY),
  consequenceIfUnresolved: optStr(LONG),
  evidenceAvailable: optEnum(YES_NO_NA),
  desiredOutcome: optStr(LONG),
  proposedSolution: arr(PROPOSED_SOLUTION),
  existingSystemRelation: optEnum(YES_NO_UNKNOWN),
  existingSystemDetail: optStr(LONG),
  dataRequired: optStr(LONG),
  integrationRequired: optEnum(YES_NO_UNKNOWN),
  integrationDetail: optStr(LONG),
  sensitiveDataFlag: optEnum(YES_NO_UNKNOWN),
  sensitiveDataDetail: optStr(LONG),
  mobileFieldNeed: optEnum(YES_NO_UNKNOWN),
  // Kaitan domain diisi reviewer (Form C); manfaat tidak lagi ditanyakan karena tumpang tindih dengan dampak.
  metricName: optStr(SHORT),
  metricUnit: optStr(64),
  baselineValue: optNum,
  targetValue: optNum,
  baseline: optStr(LONG),
  target: optStr(LONG),
  respondentUrgency: optEnum(URGENCY),
  urgencyReason: optStr(LONG),
  externalDeadline: optStr(SHORT),
  dataReadiness: optEnum(DATA_READINESS),
  processReadiness: optEnum(PROCESS_READINESS),
  ownerReadiness: optEnum(OWNER_READINESS),
  dependencies: optStr(LONG),
  estimatedCost: optStr(SHORT),
  additionalNotes: optStr(LONG),
});
export type NeedDraftInput = z.infer<typeof needDraftSchema>;
export type NeedFormValues = z.input<typeof needDraftSchema>;

/**
 * Daftar kolom wajib untuk submit. Lebih ringkas dari PRD 8.2: proses bisnis menjadi opsional, dan
 * "akibat bila tidak ditangani" digabung ke alasan urgensi; detail teknis dilengkapi saat wawancara.
 */
export const NEED_REQUIRED: { key: keyof NeedDraftInput; label: string; step: number }[] = [
  { key: "title", label: "Judul kebutuhan", step: 1 },
  { key: "processOwner", label: "Pemilik proses", step: 1 },
  { key: "problemDescription", label: "Masalah yang terjadi", step: 2 },
  { key: "currentProcess", label: "Cara proses dilakukan saat ini", step: 2 },
  { key: "desiredOutcome", label: "Perubahan / hasil yang ingin dicapai", step: 3 },
  { key: "respondentUrgency", label: "Urgensi menurut Bagian", step: 4 },
  { key: "urgencyReason", label: "Alasan urgensi dan akibat bila tidak ditangani", step: 4 },
];

/** Validasi lengkap sebelum submit. Mengembalikan map error per field. */
export function validateNeedForSubmit(v: NeedDraftInput): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const r of NEED_REQUIRED) {
    const val = v[r.key];
    const empty = val == null || (typeof val === "string" && val.trim() === "") || (Array.isArray(val) && val.length === 0);
    if (empty) errors[r.key] = `${r.label} wajib diisi.`;
  }
  if (v.impacts.length === 0) errors.impacts = "Pilih minimal satu dampak masalah.";
  if (v.existingSystemRelation === "yes" && !v.existingSystemDetail) errors.existingSystemDetail = "Jelaskan sistem yang terkait.";
  if (v.integrationRequired === "yes" && !v.integrationDetail) errors.integrationDetail = "Sebutkan Bagian / sistem yang bertukar data.";
  if (v.sensitiveDataFlag === "yes" && !v.sensitiveDataDetail) errors.sensitiveDataDetail = "Jelaskan jenis data sensitif (tanpa mengunggah datanya).";
  if ((v.baselineValue != null || v.targetValue != null) && !v.metricName) errors.metricName = "Sebutkan apa yang diukur oleh angka tersebut.";
  return errors;
}

/** Mengubah FormData multi-value menjadi objek untuk schema. */
export function needFormDataToObject(fd: FormData): Record<string, unknown> {
  const multi = new Set(["affectedParties", "impacts", "proposedSolution"]);
  const out: Record<string, unknown> = {};
  for (const key of Object.keys(needDraftSchema.shape)) {
    if (multi.has(key)) out[key] = fd.getAll(key).map(String);
    else {
      const v = fd.get(key);
      out[key] = v == null ? "" : String(v);
    }
  }
  return out;
}
