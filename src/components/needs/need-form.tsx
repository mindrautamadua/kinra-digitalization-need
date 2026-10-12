"use client";
import { useActionState, useMemo, useRef, useState } from "react";
import { saveNeedAction, type FormState } from "@/actions/respond";
import { Card, CardBody } from "@/components/ui/card";
import { CheckboxGroup, Field, Input, RadioGroup, Textarea } from "@/components/ui/input";
import { FormMessage, SubmitButton } from "@/components/ui/form";
import { Button, LinkButton } from "@/components/ui/button";
import {
  AFFECTED_PARTIES, BENEFITS, DATA_READINESS, DOMAIN_TAGS, FREQUENCY, IMPACTS, OWNER_READINESS, PROBLEM_FREQUENCY,
  PROCESS_READINESS, PROPOSED_SOLUTION, URGENCY, YES_NO_NA, YES_NO_UNKNOWN,
} from "@/lib/enums";
import { NEED_REQUIRED } from "@/lib/validation/need";
import type { DigitalNeed } from "@/lib/db/schema";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

const STEPS = [
  { n: 1, title: "Identitas & konteks" },
  { n: 2, title: "Masalah saat ini" },
  { n: 3, title: "Kebutuhan & solusi" },
  { n: 4, title: "Manfaat, urgensi & kesiapan" },
];

export function NeedForm({
  need,
  attachmentsSlot,
  staffAction,
  backHref,
}: {
  need: DigitalNeed;
  attachmentsSlot?: React.ReactNode;
  /** Bila diisi, form berjalan dalam mode koreksi administratif staf (tanpa tombol kirim). */
  staffAction?: (prev: FormState, fd: FormData) => Promise<FormState>;
  backHref?: string;
}) {
  const staffMode = Boolean(staffAction);
  const [state, action, pending] = useActionState(staffAction ?? saveNeedAction.bind(null, need.id), undefined);
  const [step, setStep] = useState(1);
  const formRef = useRef<HTMLFormElement>(null);
  const draftBtnRef = useRef<HTMLButtonElement>(null);

  // state untuk pertanyaan kondisional
  const [existingSys, setExistingSys] = useState(need.existingSystemRelation ?? "");
  const [integration, setIntegration] = useState(need.integrationRequired ?? "");
  const [sensitive, setSensitive] = useState(need.sensitiveDataFlag ?? "");
  const [evidence, setEvidence] = useState(need.evidenceAvailable ?? "");
  const [urgency, setUrgency] = useState(need.respondentUrgency ?? "");
  const [affected, setAffected] = useState<string[]>(need.affectedParties ?? []);
  const [impacts, setImpacts] = useState<string[]>(need.impacts ?? []);
  const [solutions, setSolutions] = useState<string[]>(need.proposedSolution ?? []);
  const [domains, setDomains] = useState<string[]>(need.domainTags ?? []);
  const [benefits, setBenefits] = useState<string[]>(need.expectedBenefits ?? []);
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
      const r = NEED_REQUIRED.find((x) => x.key === k);
      if (r) s.add(r.step);
      else if (["impacts", "evidenceAvailable"].includes(k)) s.add(2);
      else if (["existingSystemDetail", "integrationDetail", "sensitiveDataDetail"].includes(k)) s.add(3);
    }
    return s;
  }, [fe]);

  // Lompat ke langkah pertama yang bererror saat hasil aksi baru tiba (pola "adjust state during render").
  const [seenState, setSeenState] = useState(state);
  if (state !== seenState) {
    setSeenState(state);
    if (errorSteps.size > 0) setStep(Math.min(...errorSteps));
  }

  function saveDraftSilently() {
    if (staffMode) return; // koreksi staf disimpan eksplisit dengan alasan
    if (formRef.current && draftBtnRef.current) formRef.current.requestSubmit(draftBtnRef.current);
  }
  function go(n: number) {
    saveDraftSilently();
    setStep(n);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  const requiredOnStep = (n: number) => NEED_REQUIRED.filter((r) => r.step === n).length;

  return (
    <form ref={formRef} action={action} className="space-y-6">
      {/* Progress indicator */}
      <ol className="grid grid-cols-2 gap-2 sm:grid-cols-4" aria-label="Langkah pengisian">
        {STEPS.map((s) => {
          const active = s.n === step;
          const hasErr = errorSteps.has(s.n);
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
                <span className="block font-semibold">Langkah {s.n}</span>
                <span className="block text-muted">{s.title}</span>
              </button>
            </li>
          );
        })}
      </ol>

      {state?.error && (
        <FormMessage
          message={
            Object.keys(fe).length > 0
              ? `${state.error} ${Object.values(fe).join(" ")}`
              : state.error
          }
        />
      )}
      {state?.success && !state.error && <FormMessage message={state.success} tone="success" />}

      <Card>
        <CardBody className="space-y-5">
          {/* ---------------- Langkah 1 ---------------- */}
          <div className={step === 1 ? "space-y-5" : "hidden"}>
            <StepTitle n={1} title="Identitas dan konteks" required={requiredOnStep(1)} />
            <Field label="Judul kebutuhan" htmlFor="title" required hint="Ringkas, maks. 200 karakter. Contoh: “Penagihan utilitas tenant masih manual”." error={fe.title}>
              <Input id="title" name="title" defaultValue={need.title} maxLength={200} />
            </Field>
            <Field label="Proses bisnis terkait" htmlFor="businessProcess" required hint="Proses apa yang terdampak? Contoh: meter-to-cash utilitas, penanganan pengaduan tenant." error={fe.businessProcess}>
              <Textarea id="businessProcess" name="businessProcess" defaultValue={need.businessProcess ?? ""} maxLength={4000} />
            </Field>
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Pemilik proses" htmlFor="processOwner" required hint="Jabatan / nama pejabat yang bertanggung jawab atas proses." error={fe.processOwner}>
                <Input id="processOwner" name="processOwner" defaultValue={need.processOwner ?? ""} maxLength={200} />
              </Field>
              <Field label="Perkiraan volume" htmlFor="estimatedVolume" hint="Angka atau rentang; kosongkan bila belum diketahui. Contoh: ±300 tagihan/bulan." error={fe.estimatedVolume}>
                <Input id="estimatedVolume" name="estimatedVolume" defaultValue={need.estimatedVolume ?? ""} maxLength={200} />
              </Field>
            </div>
            <Field label="Pihak terdampak / pengguna" hint="Pilih semua yang relevan.">
              <CheckboxGroup name="affectedParties" options={AFFECTED_PARTIES} value={affected} onChange={setAffected} />
            </Field>
            <Field label="Frekuensi proses">
              <RadioGroup name="frequency" options={FREQUENCY} value={frequency} onChange={setFrequency} inline />
            </Field>
          </div>

          {/* ---------------- Langkah 2 ---------------- */}
          <div className={step === 2 ? "space-y-5" : "hidden"}>
            <StepTitle n={2} title="Masalah saat ini" required={requiredOnStep(2) + 1} />
            <Field label="Apa masalah yang terjadi?" htmlFor="problemDescription" required hint="Jelaskan masalahnya, bukan solusinya. Apa yang sulit, lambat, salah, atau tidak tersedia?" error={fe.problemDescription}>
              <Textarea id="problemDescription" name="problemDescription" defaultValue={need.problemDescription ?? ""} maxLength={4000} className="min-h-[140px]" />
            </Field>
            <Field label="Bagaimana proses dilakukan saat ini?" htmlFor="currentProcess" required hint="Langkah-langkah, alat (spreadsheet, email, aplikasi), dan siapa yang mengerjakan." error={fe.currentProcess}>
              <Textarea id="currentProcess" name="currentProcess" defaultValue={need.currentProcess ?? ""} maxLength={4000} />
            </Field>
            <Field label="Dampak masalah" required hint="Pilih minimal satu." error={fe.impacts}>
              <CheckboxGroup name="impacts" options={IMPACTS} value={impacts} onChange={setImpacts} />
            </Field>
            <Field label="Seberapa sering masalah terjadi?">
              <RadioGroup name="problemFrequency" options={PROBLEM_FREQUENCY} value={problemFreq} onChange={setProblemFreq} inline />
            </Field>
            <Field label="Apa dampaknya jika masalah tidak ditangani?" htmlFor="consequenceIfUnresolved" required error={fe.consequenceIfUnresolved}>
              <Textarea id="consequenceIfUnresolved" name="consequenceIfUnresolved" defaultValue={need.consequenceIfUnresolved ?? ""} maxLength={4000} />
            </Field>
            <Field label="Apakah ada contoh atau bukti pendukung?" hint="Bukti dapat diunggah pada bagian Lampiran di bawah. Samarkan data pribadi / rahasia yang tidak diperlukan." error={fe.evidenceAvailable}>
              <RadioGroup name="evidenceAvailable" options={YES_NO_NA} value={evidence} onChange={setEvidence} inline />
            </Field>
            {evidence === "yes" && attachmentsSlot && <div className="rounded-md border border-border bg-slate-50 p-4">{attachmentsSlot}</div>}
          </div>

          {/* ---------------- Langkah 3 ---------------- */}
          <div className={step === 3 ? "space-y-5" : "hidden"}>
            <StepTitle n={3} title="Kebutuhan dan solusi" required={requiredOnStep(3)} />
            <Field label="Perubahan atau hasil apa yang ingin dicapai?" htmlFor="desiredOutcome" required hint="Fokus pada hasil (outcome), misalnya “tagihan terbit H+1 setelah pembacaan meter”." error={fe.desiredOutcome}>
              <Textarea id="desiredOutcome" name="desiredOutcome" defaultValue={need.desiredOutcome ?? ""} maxLength={4000} className="min-h-[120px]" />
            </Field>
            <Field label="Usulan solusi (opsional)" hint="Boleh memilih “Belum tahu”. Solusi akhir ditentukan setelah validasi.">
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
            <Field label="Kaitan dengan domain KINRA" hint="Tenant, investor, utilitas, kawasan, aset, infrastruktur, dan lainnya. Pilih semua yang relevan.">
              <CheckboxGroup name="domainTags" options={DOMAIN_TAGS} value={domains} onChange={setDomains} />
            </Field>
          </div>

          {/* ---------------- Langkah 4 ---------------- */}
          <div className={step === 4 ? "space-y-5" : "hidden"}>
            <StepTitle n={4} title="Manfaat, urgensi, dan kesiapan" required={requiredOnStep(4)} />
            <Field label="Manfaat yang diharapkan" hint="Pilih semua yang relevan.">
              <CheckboxGroup name="expectedBenefits" options={BENEFITS} value={benefits} onChange={setBenefits} />
            </Field>
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Baseline / kondisi saat ini" htmlFor="baseline" hint="Angka jika diketahui: waktu proses, jumlah kesalahan, tunggakan, laporan manual." error={fe.baseline}>
                <Textarea id="baseline" name="baseline" defaultValue={need.baseline ?? ""} maxLength={4000} />
              </Field>
              <Field label="Target yang diharapkan" htmlFor="target" hint="Angka jika diketahui; opsional." error={fe.target}>
                <Textarea id="target" name="target" defaultValue={need.target ?? ""} maxLength={4000} />
              </Field>
            </div>
            <Field label="Urgensi menurut Bagian" required error={fe.respondentUrgency}>
              <RadioGroup name="respondentUrgency" options={URGENCY} value={urgency} onChange={setUrgency} inline />
            </Field>
            <Field label="Alasan urgensi" htmlFor="urgencyReason" required error={fe.urgencyReason}>
              <Textarea id="urgencyReason" name="urgencyReason" defaultValue={need.urgencyReason ?? ""} maxLength={4000} />
            </Field>
            <Field label="Tenggat eksternal atau ketergantungan waktu" htmlFor="externalDeadline" hint="Opsional. Contoh: kewajiban pelaporan regulator Maret 2027." error={fe.externalDeadline}>
              <Input id="externalDeadline" name="externalDeadline" defaultValue={need.externalDeadline ?? ""} maxLength={200} />
            </Field>
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
            <Field label="Perkiraan biaya jika diketahui" htmlFor="estimatedCost" hint="Opsional. Tidak perlu membuat estimasi teknis." error={fe.estimatedCost}>
              <Input id="estimatedCost" name="estimatedCost" defaultValue={need.estimatedCost ?? ""} maxLength={200} />
            </Field>
            <Field label="Catatan tambahan" htmlFor="additionalNotes" error={fe.additionalNotes}>
              <Textarea id="additionalNotes" name="additionalNotes" defaultValue={need.additionalNotes ?? ""} maxLength={4000} />
            </Field>
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
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={() => go(Math.max(1, step - 1))} disabled={step === 1}>
              Sebelumnya
            </Button>
            {step < 4 && (
              <Button type="button" variant="secondary" onClick={() => go(step + 1)}>
                Lanjut
              </Button>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            <LinkButton href={backHref ?? `/respond/needs/${need.id}`} variant="ghost">
              Tutup
            </LinkButton>
            {staffMode ? (
              <SubmitButton name="intent" value="draft" pendingText="Menyimpan…" disabled={pending}>
                <Check className="h-4 w-4" /> Simpan koreksi
              </SubmitButton>
            ) : (
              <>
                <button ref={draftBtnRef} type="submit" name="intent" value="draft" className="sr-only" tabIndex={-1} aria-hidden>
                  simpan draft
                </button>
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

function StepTitle({ n, title, required }: { n: number; title: string; required: number }) {
  return (
    <div className="border-b border-border pb-3">
      <h2 className="text-lg font-semibold">
        Langkah {n} · {title}
      </h2>
      <p className="text-xs text-muted">
        {required > 0 ? `${required} kolom wajib pada langkah ini (ditandai *).` : "Tidak ada kolom wajib pada langkah ini."} Draft tersimpan otomatis saat berpindah langkah.
      </p>
    </div>
  );
}
