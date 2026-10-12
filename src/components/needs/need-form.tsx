"use client";
import { useActionState, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { saveNeedAction, type FormState } from "@/actions/respond";
import { Card, CardBody } from "@/components/ui/card";
import { CheckboxGroup, Field, Input, RadioGroup, Textarea } from "@/components/ui/input";
import { FormMessage, SubmitButton } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import {
  AFFECTED_PARTIES, DATA_READINESS, FREQUENCY, IMPACTS, OWNER_READINESS, PROBLEM_FREQUENCY,
  PROCESS_READINESS, PROPOSED_SOLUTION, URGENCY, YES_NO_NA, YES_NO_UNKNOWN,
} from "@/lib/enums";
import { NEED_REQUIRED, needFormDataToObject, validateNeedForSubmit, type NeedDraftInput } from "@/lib/validation/need";
import type { DigitalNeed } from "@/lib/db/schema";
import type { PreviousNeed } from "@/lib/queries/respond";
import { cn } from "@/lib/utils";
import { Check, Copy, Info } from "lucide-react";

const STEPS = [
  { n: 1, title: "Identitas & konteks" },
  { n: 2, title: "Masalah saat ini" },
  { n: 3, title: "Kebutuhan & solusi" },
  { n: 4, title: "Urgensi & kesiapan" },
];

const AUTOSAVE_MS = 30_000;

/** Langkah tempat sebuah kolom berada, untuk navigasi dari pesan error. */
function stepOf(key: string): number | undefined {
  const r = NEED_REQUIRED.find((x) => x.key === key);
  if (r) return r.step;
  if (["frequency", "estimatedVolume", "affectedParties"].includes(key)) return 1;
  if (["impacts", "evidenceAvailable", "problemFrequency"].includes(key)) return 2;
  if (["existingSystemDetail", "integrationDetail", "sensitiveDataDetail", "dataRequired"].includes(key)) return 3;
  if (["metricName", "metricUnit", "baselineValue", "targetValue", "baseline", "target", "externalDeadline", "dependencies", "estimatedCost", "additionalNotes"].includes(key)) return 4;
  return undefined;
}

function fieldEl(form: HTMLFormElement | null, key: string) {
  return document.getElementById(key) ?? form?.querySelector<HTMLElement>(`[name="${key}"]`) ?? null;
}

type SaveStatus = { tone: "idle" | "saving" | "saved" | "error"; text?: string };

export function NeedForm({
  need,
  previous,
  attachmentsSlot,
  staffAction,
  backHref,
}: {
  need: DigitalNeed;
  /** Kebutuhan lain di Bagian yang sama, untuk menyalin pemilik proses dan kesiapan. */
  previous?: PreviousNeed;
  attachmentsSlot?: React.ReactNode;
  /** Bila diisi, form berjalan dalam mode koreksi administratif staf (tanpa tombol kirim). */
  staffAction?: (prev: FormState, fd: FormData) => Promise<FormState>;
  backHref?: string;
}) {
  const staffMode = Boolean(staffAction);
  const [state, action, pending] = useActionState(staffAction ?? saveNeedAction.bind(null, need.id), undefined);
  const [step, setStep] = useState(1);
  const formRef = useRef<HTMLFormElement>(null);
  const router = useRouter();

  // state untuk pertanyaan kondisional
  const [existingSys, setExistingSys] = useState(need.existingSystemRelation ?? "");
  const [integration, setIntegration] = useState(need.integrationRequired ?? "");
  const [sensitive, setSensitive] = useState(need.sensitiveDataFlag ?? "");
  const [evidence, setEvidence] = useState(need.evidenceAvailable ?? "");
  const [urgency, setUrgency] = useState(need.respondentUrgency ?? "");
  const [affected, setAffected] = useState<string[]>(need.affectedParties ?? []);
  const [impacts, setImpacts] = useState<string[]>(need.impacts ?? []);
  const [solutions, setSolutions] = useState<string[]>(need.proposedSolution ?? []);
  const [frequency, setFrequency] = useState(need.frequency ?? "");
  const [problemFreq, setProblemFreq] = useState(need.problemFrequency ?? "");
  const [mobile, setMobile] = useState(need.mobileFieldNeed ?? "");
  const [dataReady, setDataReady] = useState(need.dataReadiness ?? "");
  const [procReady, setProcReady] = useState(need.processReadiness ?? "");
  const [ownerReady, setOwnerReady] = useState(need.ownerReadiness ?? "");

  const fe = useMemo(() => state?.fieldErrors ?? {}, [state]);
  const errorSteps = useMemo(() => {
    const s = new Set<number>();
    for (const k of Object.keys(fe)) {
      const n = stepOf(k);
      if (n) s.add(n);
    }
    return s;
  }, [fe]);

  // Kolom wajib yang masih kosong, dihitung ulang setiap isian berubah (untuk tanda centang per langkah).
  const [missing, setMissing] = useState(() => validateNeedForSubmit({ ...need, impacts: need.impacts ?? [] } as NeedDraftInput));
  const stepComplete = (n: number) => !Object.keys(missing).some((k) => stepOf(k) === n);

  // Simpan otomatis: versionRef naik tiap perubahan; savedVersionRef = versi terakhir yang tersimpan.
  const versionRef = useRef(0);
  const savedVersionRef = useRef(0);
  const savingRef = useRef<Promise<boolean> | null>(null);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>({ tone: "idle" });
  const draftAction = useMemo(() => saveNeedAction.bind(null, need.id), [need.id]);
  const isDirty = () => versionRef.current !== savedVersionRef.current;

  function handleChange() {
    versionRef.current += 1;
    if (formRef.current) setMissing(validateNeedForSubmit(needFormDataToObject(new FormData(formRef.current)) as NeedDraftInput));
  }

  /** Menyimpan draft langsung lewat server action (bukan submit form) agar isian yang sedang diketik tidak ter-reset. */
  const saveDraft = useCallback(async (): Promise<boolean> => {
    if (staffMode || !formRef.current) return true;
    if (savingRef.current) await savingRef.current;
    if (versionRef.current === savedVersionRef.current) return true;
    const version = versionRef.current;
    const fd = new FormData(formRef.current);
    fd.set("intent", "draft");
    setSaveStatus({ tone: "saving" });
    const run = draftAction(undefined, fd)
      .then((res) => {
        if (res?.error) {
          setSaveStatus({ tone: "error", text: res.error });
          return false;
        }
        savedVersionRef.current = version;
        setSaveStatus({ tone: "saved", text: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) });
        return true;
      })
      .catch(() => {
        setSaveStatus({ tone: "error", text: "Koneksi bermasalah." });
        return false;
      })
      .finally(() => {
        savingRef.current = null;
      });
    savingRef.current = run;
    return run;
  }, [staffMode, draftAction]);

  useEffect(() => {
    if (staffMode) return;
    const t = window.setInterval(() => void saveDraft(), AUTOSAVE_MS);
    return () => window.clearInterval(t);
  }, [staffMode, saveDraft]);

  useEffect(() => {
    function warn(e: BeforeUnloadEvent) {
      if (versionRef.current !== savedVersionRef.current) e.preventDefault();
    }
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, []);

  async function close() {
    const href = backHref ?? `/respond/needs/${need.id}`;
    if (staffMode) {
      if (isDirty() && !window.confirm("Koreksi belum disimpan. Keluar tanpa menyimpan?")) return;
    } else if (!(await saveDraft()) && !window.confirm("Draft gagal disimpan. Keluar dan buang perubahan terakhir?")) {
      return;
    }
    router.push(href);
  }

  /** Menyalin isian yang biasanya sama dalam satu Bagian; kolom teks yang sudah diisi tidak ditimpa. */
  function copyFromPrevious() {
    if (!previous || !formRef.current) return;
    const setIfEmpty = (name: string, value: string | null) => {
      const el = formRef.current?.elements.namedItem(name);
      if (value && (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) && !el.value.trim()) el.value = value;
    };
    setIfEmpty("processOwner", previous.processOwner);
    setIfEmpty("dependencies", previous.dependencies);
    if (previous.dataReadiness) setDataReady(previous.dataReadiness);
    if (previous.processReadiness) setProcReady(previous.processReadiness);
    if (previous.ownerReadiness) setOwnerReady(previous.ownerReadiness);
    handleChange();
  }

  // Buka bagian opsional yang memuat kolom bererror agar pesannya terlihat.
  useEffect(() => {
    for (const k of Object.keys(fe)) fieldEl(formRef.current, k)?.closest("details")?.setAttribute("open", "");
  }, [fe]);

  function jumpTo(key: string) {
    const n = stepOf(key);
    if (n) setStep(n);
    window.setTimeout(() => {
      const el = fieldEl(formRef.current, key);
      el?.closest("details")?.setAttribute("open", "");
      el?.scrollIntoView({ behavior: "smooth", block: "center" });
      el?.focus({ preventScroll: true });
    }, 50);
  }

  // Lompat ke langkah pertama yang bererror saat hasil aksi baru tiba (pola "adjust state during render").
  const [seenState, setSeenState] = useState(state);
  if (state !== seenState) {
    setSeenState(state);
    if (errorSteps.size > 0) setStep(Math.min(...errorSteps));
  }

  function go(n: number) {
    void saveDraft(); // koreksi staf tidak disimpan otomatis; disimpan eksplisit dengan alasan
    setStep(n);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  const requiredOnStep = (n: number) => NEED_REQUIRED.filter((r) => r.step === n).length;

  return (
    <form
      ref={formRef}
      action={action}
      onChange={handleChange}
      onSubmit={() => {
        savedVersionRef.current = versionRef.current;
      }}
      className="space-y-6"
    >
      {!staffMode && (
        <div className="flex gap-3 rounded-md border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900">
          <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          <div className="space-y-1">
            <p>
              <span className="font-medium">Perkiraan waktu ±10 menit</span> untuk 8 kolom wajib (ditandai *). Bagian &ldquo;Detail tambahan&rdquo; di tiap langkah
              boleh dilewati. Tim Assessment akan menanyakannya saat klarifikasi atau wawancara bila diperlukan. Draft tersimpan otomatis setiap 30 detik.
            </p>
            <p>
              <span className="font-medium">Setelah dikirim:</span> Tim Assessment TI menelaah kebutuhan ini, lalu dapat meminta klarifikasi, menjadwalkan
              wawancara, atau menetapkan prioritas. Anda akan menerima notifikasi untuk setiap tindak lanjut, dan statusnya dapat dipantau di halaman kebutuhan ini.
            </p>
          </div>
        </div>
      )}

      {/* Progress indicator */}
      <ol className="grid grid-cols-2 gap-2 sm:grid-cols-4" aria-label="Langkah pengisian">
        {STEPS.map((s) => {
          const active = s.n === step;
          const hasErr = errorSteps.has(s.n);
          const done = !hasErr && stepComplete(s.n);
          return (
            <li key={s.n}>
              <button
                type="button"
                onClick={() => go(s.n)}
                className={cn(
                  "w-full rounded-md border px-3 py-2 text-left text-xs sm:text-sm",
                  active ? "border-primary bg-accent text-primary" : "border-border bg-surface hover:bg-slate-50",
                  hasErr && "border-danger",
                )}
                aria-current={active ? "step" : undefined}
              >
                <span className="flex items-center gap-1 font-semibold">
                  Langkah {s.n}
                  {done && <Check className="h-4 w-4 text-success" aria-label="kolom wajib lengkap" />}
                </span>
                <span className="block text-muted">{s.title}</span>
              </button>
            </li>
          );
        })}
      </ol>

      {state?.error && <FormMessage message={state.error} />}
      {Object.keys(fe).length > 0 && (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          <p className="mb-1">Klik untuk menuju kolom yang perlu diperbaiki:</p>
          <ul className="space-y-0.5">
            {Object.entries(fe).map(([k, m]) => {
              const n = stepOf(k);
              return (
                <li key={k}>
                  <button type="button" onClick={() => jumpTo(k)} className="text-left underline underline-offset-2 hover:no-underline">
                    {n ? `Langkah ${n} · ` : ""}
                    {m}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
      {state?.success && !state.error && <FormMessage message={state.success} tone="success" />}

      <Card>
        <CardBody className="space-y-5">
          {/* ---------------- Langkah 1 ---------------- */}
          <div className={step === 1 ? "space-y-5" : "hidden"}>
            <StepTitle n={1} title="Identitas dan konteks" required={requiredOnStep(1)} autosave={!staffMode} />
            <Field label="Judul kebutuhan" htmlFor="title" required hint="Ringkas, maks. 200 karakter. Contoh: “Penagihan utilitas tenant masih manual”." error={fe.title}>
              <Input id="title" name="title" defaultValue={need.title} maxLength={200} />
            </Field>
            <Field label="Pemilik proses" htmlFor="processOwner" required hint="Jabatan / nama pejabat yang bertanggung jawab atas proses. Terisi awal dari Profil Bagian; ubah bila berbeda." error={fe.processOwner}>
              <Input id="processOwner" name="processOwner" defaultValue={need.processOwner ?? ""} maxLength={200} />
            </Field>
            <OptionalSection open={staffMode}>
              <Field label="Proses bisnis terkait" htmlFor="businessProcess" hint="Bila berbeda dari judul. Proses apa yang terdampak? Contoh: pembacaan meter sampai penagihan utilitas, penanganan pengaduan tenant." error={fe.businessProcess}>
                <Textarea id="businessProcess" name="businessProcess" defaultValue={need.businessProcess ?? ""} maxLength={4000} />
              </Field>
              <Field label="Perkiraan volume" htmlFor="estimatedVolume" hint="Angka atau rentang; kosongkan bila belum diketahui. Contoh: ±300 tagihan/bulan." error={fe.estimatedVolume}>
                <Input id="estimatedVolume" name="estimatedVolume" defaultValue={need.estimatedVolume ?? ""} maxLength={200} />
              </Field>
              <Field label="Pihak terdampak / pengguna" hint="Pilih semua yang relevan.">
                <CheckboxGroup name="affectedParties" options={AFFECTED_PARTIES} value={affected} onChange={setAffected} />
              </Field>
              <Field label="Frekuensi proses">
                <RadioGroup name="frequency" options={FREQUENCY} value={frequency} onChange={setFrequency} inline />
              </Field>
            </OptionalSection>
          </div>

          {/* ---------------- Langkah 2 ---------------- */}
          <div className={step === 2 ? "space-y-5" : "hidden"}>
            <StepTitle n={2} title="Masalah saat ini" required={requiredOnStep(2) + 1} autosave={!staffMode} />
            <Field label="Apa masalah yang terjadi?" htmlFor="problemDescription" required hint="Jelaskan masalahnya, bukan solusinya. Apa yang sulit, lambat, salah, atau tidak tersedia?" error={fe.problemDescription}>
              <Textarea id="problemDescription" name="problemDescription" defaultValue={need.problemDescription ?? ""} maxLength={4000} className="min-h-[140px]" />
            </Field>
            <Field label="Bagaimana proses dilakukan saat ini?" htmlFor="currentProcess" required hint="Langkah-langkah, alat (spreadsheet, email, aplikasi), dan siapa yang mengerjakan." error={fe.currentProcess}>
              <Textarea id="currentProcess" name="currentProcess" defaultValue={need.currentProcess ?? ""} maxLength={4000} />
            </Field>
            <Field label="Dampak masalah" required hint="Pilih minimal satu." error={fe.impacts}>
              <CheckboxGroup name="impacts" options={IMPACTS} value={impacts} onChange={setImpacts} />
            </Field>
            {/* Digabung ke "alasan urgensi"; isian lama tetap tersimpan. */}
            <input type="hidden" name="consequenceIfUnresolved" value={need.consequenceIfUnresolved ?? ""} />
            <OptionalSection open={staffMode}>
              <Field label="Seberapa sering masalah terjadi?">
                <RadioGroup name="problemFrequency" options={PROBLEM_FREQUENCY} value={problemFreq} onChange={setProblemFreq} inline />
              </Field>
              <Field label="Apakah ada contoh atau bukti pendukung?" hint="Bukti dapat diunggah pada bagian Lampiran di bawah. Samarkan data pribadi / rahasia yang tidak diperlukan." error={fe.evidenceAvailable}>
                <RadioGroup name="evidenceAvailable" options={YES_NO_NA} value={evidence} onChange={setEvidence} inline />
              </Field>
              {evidence === "yes" && attachmentsSlot && <div className="rounded-md border border-border bg-slate-50 p-4">{attachmentsSlot}</div>}
            </OptionalSection>
          </div>

          {/* ---------------- Langkah 3 ---------------- */}
          <div className={step === 3 ? "space-y-5" : "hidden"}>
            <StepTitle n={3} title="Kebutuhan dan solusi" required={requiredOnStep(3)} autosave={!staffMode} />
            <Field label="Perubahan atau hasil apa yang ingin dicapai?" htmlFor="desiredOutcome" required hint="Tulis hasil yang ingin dicapai, bukan fitur aplikasinya. Contoh: “tagihan terbit H+1 setelah pembacaan meter”." error={fe.desiredOutcome}>
              <Textarea id="desiredOutcome" name="desiredOutcome" defaultValue={need.desiredOutcome ?? ""} maxLength={4000} className="min-h-[120px]" />
            </Field>
            <OptionalSection open={staffMode}>
              <Field label="Usulan solusi" hint="Boleh memilih “Belum tahu”. Solusi akhir ditentukan setelah validasi.">
                <CheckboxGroup name="proposedSolution" options={PROPOSED_SOLUTION} value={solutions} onChange={setSolutions} />
              </Field>
              <Field label="Apakah kebutuhan ini terkait dengan sistem yang sudah ada?">
                <RadioGroup name="existingSystemRelation" options={YES_NO_UNKNOWN} value={existingSys} onChange={setExistingSys} inline />
              </Field>
              {existingSys === "yes" && (
                <Field label="Jelaskan sistem yang terkait" htmlFor="existingSystemDetail" required error={fe.existingSystemDetail}>
                  <Textarea id="existingSystemDetail" name="existingSystemDetail" defaultValue={need.existingSystemDetail ?? ""} maxLength={4000} />
                </Field>
              )}
              {existingSys !== "yes" && <input type="hidden" name="existingSystemDetail" value={need.existingSystemDetail ?? ""} />}
              <Field label="Data yang diperlukan atau dihasilkan" htmlFor="dataRequired" hint="Contoh: data meter, kontrak tenant, master aset." error={fe.dataRequired}>
                <Textarea id="dataRequired" name="dataRequired" defaultValue={need.dataRequired ?? ""} maxLength={4000} />
              </Field>
              <Field label="Apakah diperlukan pertukaran data dengan Bagian / sistem lain?">
                <RadioGroup name="integrationRequired" options={YES_NO_UNKNOWN} value={integration} onChange={setIntegration} inline />
              </Field>
              {integration === "yes" ? (
                <Field label="Sebutkan Bagian / sistem yang bertukar data" htmlFor="integrationDetail" required error={fe.integrationDetail}>
                  <Textarea id="integrationDetail" name="integrationDetail" defaultValue={need.integrationDetail ?? ""} maxLength={4000} />
                </Field>
              ) : (
                <input type="hidden" name="integrationDetail" value={need.integrationDetail ?? ""} />
              )}
              <Field label="Apakah terdapat data sensitif / pribadi / rahasia atau data kritis?" hint="Jelaskan jenisnya saja; jangan mengunggah data sensitif yang tidak diperlukan.">
                <RadioGroup name="sensitiveDataFlag" options={YES_NO_UNKNOWN} value={sensitive} onChange={setSensitive} inline />
              </Field>
              {sensitive === "yes" ? (
                <Field label="Jenis data sensitif" htmlFor="sensitiveDataDetail" required error={fe.sensitiveDataDetail}>
                  <Textarea id="sensitiveDataDetail" name="sensitiveDataDetail" defaultValue={need.sensitiveDataDetail ?? ""} maxLength={4000} />
                </Field>
              ) : (
                <input type="hidden" name="sensitiveDataDetail" value={need.sensitiveDataDetail ?? ""} />
              )}
              <Field label="Apakah proses memerlukan akses dari lapangan / perangkat mobile?">
                <RadioGroup name="mobileFieldNeed" options={YES_NO_UNKNOWN} value={mobile} onChange={setMobile} inline />
              </Field>
            </OptionalSection>
          </div>

          {/* ---------------- Langkah 4 ---------------- */}
          <div className={step === 4 ? "space-y-5" : "hidden"}>
            <StepTitle n={4} title="Urgensi dan kesiapan" required={requiredOnStep(4)} autosave={!staffMode} />
            <Field label="Urgensi menurut Bagian" required hint="Pilih sesuai definisi agar kebutuhan dapat dibandingkan secara adil antar-Bagian." error={fe.respondentUrgency}>
              <RadioGroup name="respondentUrgency" options={URGENCY} value={urgency} onChange={setUrgency} />
            </Field>
            <Field
              label="Mengapa mendesak, dan apa akibatnya bila tidak ditangani?"
              htmlFor="urgencyReason"
              required
              hint="Sebutkan akibat yang nyata, dengan angka bila ada. Contoh: “Tunggakan tenant naik ±Rp200 juta/bulan karena tagihan terlambat terbit, dan regulator mewajibkan laporan elektronik mulai Maret 2027.” Hindari jawaban umum seperti “pekerjaan lambat”."
              error={fe.urgencyReason}
            >
              <Textarea id="urgencyReason" name="urgencyReason" defaultValue={need.urgencyReason ?? ""} maxLength={4000} className="min-h-[120px]" />
            </Field>
            <OptionalSection open={staffMode}>
              <fieldset className="space-y-3 rounded-md border border-border p-4">
                <legend className="px-1 text-sm font-medium">Ukuran keberhasilan</legend>
                <p className="text-xs text-muted">
                  Satu angka yang paling menggambarkan masalahnya, bila diketahui. Contoh: waktu penerbitan tagihan, 5 → 1 hari kerja. Boleh dikosongkan;
                  Tim Assessment dapat membantu menentukannya saat wawancara.
                </p>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Apa yang diukur" htmlFor="metricName" hint="Contoh: waktu penerbitan tagihan." error={fe.metricName}>
                    <Input id="metricName" name="metricName" defaultValue={need.metricName ?? ""} maxLength={200} />
                  </Field>
                  <Field label="Satuan" htmlFor="metricUnit" hint="Contoh: hari kerja, kesalahan/bulan, Rp juta." error={fe.metricUnit}>
                    <Input id="metricUnit" name="metricUnit" defaultValue={need.metricUnit ?? ""} maxLength={64} />
                  </Field>
                  <Field label="Angka saat ini" htmlFor="baselineValue" error={fe.baselineValue}>
                    <Input id="baselineValue" name="baselineValue" type="number" step="any" inputMode="decimal" defaultValue={need.baselineValue ?? ""} />
                  </Field>
                  <Field label="Angka target" htmlFor="targetValue" error={fe.targetValue}>
                    <Input id="targetValue" name="targetValue" type="number" step="any" inputMode="decimal" defaultValue={need.targetValue ?? ""} />
                  </Field>
                </div>
                <Field label="Keterangan (opsional)" htmlFor="baseline" hint="Konteks angka di atas, atau kondisi saat ini bila belum ada angkanya." error={fe.baseline}>
                  <Textarea id="baseline" name="baseline" defaultValue={need.baseline ?? ""} maxLength={4000} className="min-h-[72px]" />
                </Field>
                {/* Isian target teks dari versi formulir lama dipertahankan apa adanya. */}
                <input type="hidden" name="target" value={need.target ?? ""} />
              </fieldset>
              <Field label="Tenggat eksternal atau ketergantungan waktu" htmlFor="externalDeadline" hint="Contoh: kewajiban pelaporan regulator Maret 2027." error={fe.externalDeadline}>
                <Input id="externalDeadline" name="externalDeadline" defaultValue={need.externalDeadline ?? ""} maxLength={200} />
              </Field>
              {previous && !staffMode && (
                <div className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border bg-slate-50 px-3 py-2 text-sm">
                  <span className="text-muted">
                    Kesiapan biasanya sama untuk kebutuhan dalam satu Bagian. Sumber: {previous.needCode ?? "draft"} · {previous.title || "tanpa judul"}
                  </span>
                  <Button type="button" variant="outline" size="sm" onClick={copyFromPrevious}>
                    <Copy className="h-4 w-4" /> Salin dari kebutuhan sebelumnya
                  </Button>
                </div>
              )}
              <div className="grid gap-5 lg:grid-cols-3">
                <Field label="Kesiapan data">
                  <RadioGroup name="dataReadiness" options={DATA_READINESS} value={dataReady} onChange={setDataReady} />
                </Field>
                <Field label="Kesiapan proses / SOP">
                  <RadioGroup name="processReadiness" options={PROCESS_READINESS} value={procReady} onChange={setProcReady} />
                </Field>
                <Field label="Ketersediaan pemilik proses untuk terlibat">
                  <RadioGroup name="ownerReadiness" options={OWNER_READINESS} value={ownerReady} onChange={setOwnerReady} />
                </Field>
              </div>
              <Field label="Ketergantungan kepada Bagian atau pihak lain" htmlFor="dependencies" error={fe.dependencies}>
                <Textarea id="dependencies" name="dependencies" defaultValue={need.dependencies ?? ""} maxLength={4000} />
              </Field>
              <Field label="Perkiraan biaya jika diketahui" htmlFor="estimatedCost" hint="Tidak perlu membuat estimasi teknis." error={fe.estimatedCost}>
                <Input id="estimatedCost" name="estimatedCost" defaultValue={need.estimatedCost ?? ""} maxLength={200} />
              </Field>
              <Field label="Catatan tambahan" htmlFor="additionalNotes" error={fe.additionalNotes}>
                <Textarea id="additionalNotes" name="additionalNotes" defaultValue={need.additionalNotes ?? ""} maxLength={4000} />
              </Field>
            </OptionalSection>
            {attachmentsSlot && (
              <div className="rounded-md border border-border bg-slate-50 p-4">
                <p className="mb-2 text-sm font-medium">Lampiran pendukung (opsional, privat)</p>
                {attachmentsSlot}
              </div>
            )}
          </div>
        </CardBody>
      </Card>

      {staffMode && (
        <Card>
          <CardBody>
            <Field label="Alasan koreksi administratif" htmlFor="editReason" required hint="Dicatat di audit trail bersama nilai sebelum dan sesudah perubahan.">
              <Input id="editReason" name="editReason" maxLength={500} required />
            </Field>
          </CardBody>
        </Card>
      )}

      {/* Navigasi */}
      <div className="sticky bottom-0 -mx-4 border-t border-border bg-surface/95 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <Button type="button" variant="outline" onClick={() => go(Math.max(1, step - 1))} disabled={step === 1}>
              Sebelumnya
            </Button>
            {step < 4 && (
              <Button type="button" variant="secondary" onClick={() => go(step + 1)}>
                Lanjut
              </Button>
            )}
            {!staffMode && saveStatus.tone !== "idle" && (
              <span role="status" className={cn("text-xs", saveStatus.tone === "error" ? "text-danger" : "text-muted")}>
                {saveStatus.tone === "saving"
                  ? "Menyimpan draft…"
                  : saveStatus.tone === "saved"
                    ? `Draft tersimpan otomatis ${saveStatus.text}`
                    : `Gagal menyimpan draft. ${saveStatus.text}`}
              </span>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="ghost" onClick={() => void close()}>
              Tutup
            </Button>
            {staffMode ? (
              <SubmitButton name="intent" value="draft" pendingText="Menyimpan…" disabled={pending}>
                <Check className="h-4 w-4" /> Simpan koreksi
              </SubmitButton>
            ) : (
              <>
                <SubmitButton variant="outline" name="intent" value="draft" pendingText="Menyimpan…">
                  Simpan Draft
                </SubmitButton>
                <SubmitButton name="intent" value="submit" pendingText="Mengirim…" disabled={pending}>
                  <Check className="h-4 w-4" /> Kirim Kebutuhan
                </SubmitButton>
              </>
            )}
          </div>
        </div>
      </div>
    </form>
  );
}

function StepTitle({ n, title, required, autosave }: { n: number; title: string; required: number; autosave: boolean }) {
  return (
    <div className="border-b border-border pb-3">
      <h2 className="text-lg font-semibold">
        Langkah {n} · {title}
      </h2>
      <p className="text-xs text-muted">
        {required > 0 ? `${required} kolom wajib pada langkah ini (ditandai *).` : "Tidak ada kolom wajib pada langkah ini."}
        {autosave && " Draft tersimpan otomatis setiap 30 detik dan saat berpindah langkah."}
      </p>
    </div>
  );
}

/** Kolom opsional yang tertutup secara default agar responden fokus pada kolom wajib. */
function OptionalSection({ open, children }: { open?: boolean; children: React.ReactNode }) {
  return (
    <details open={open} className="rounded-md border border-dashed border-border">
      <summary className="cursor-pointer select-none px-4 py-3 text-sm font-medium">
        Detail tambahan (opsional)
        <span className="block text-xs font-normal text-muted">Boleh dilewati. Tim Assessment dapat melengkapinya bersama Anda saat wawancara.</span>
      </summary>
      <div className="space-y-5 border-t border-border px-4 py-4">{children}</div>
    </details>
  );
}
