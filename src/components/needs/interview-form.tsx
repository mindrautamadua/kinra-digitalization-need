"use client";
import { useActionState } from "react";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Field, Input, Select, Textarea } from "@/components/ui/input";
import { FormMessage, SubmitButton } from "@/components/ui/form";
import { LinkButton } from "@/components/ui/button";
import { INTERVIEW_STATUS_LABELS } from "@/lib/enums";
import type { Interview } from "@/lib/db/schema";
import type { FormState } from "@/actions/respond";
import { toDatetimeLocal, needCodeLabel } from "@/lib/utils";

type NeedOpt = { id: string; needCode: string | null; title: string; departmentName: string };
type UserOpt = { id: string; fullName: string };

export function InterviewForm({
  action,
  interview,
  needs,
  fixedNeedId,
  staff,
  backHref,
}: {
  action: (prev: FormState, fd: FormData) => Promise<FormState>;
  interview?: Interview | null;
  needs: NeedOpt[];
  fixedNeedId?: string;
  staff: UserOpt[];
  backHref: string;
}) {
  const [state, formAction] = useActionState(action, undefined);
  const i = interview;
  return (
    <form action={formAction} className="space-y-4">
      <Card>
        <CardHeader title="Form D — Interview Tracker" description="Catat tujuan, jadwal, temuan, dan keputusan tindak lanjut. Status 'Dijadwalkan' / 'Selesai' akan menyinkronkan status kebutuhan." />
        <CardBody className="space-y-5">
          <div className="grid gap-5 md:grid-cols-2">
            <Field label="Kebutuhan terkait" htmlFor="needId" required className="md:col-span-2">
              {fixedNeedId || i ? (
                <>
                  <input type="hidden" name="needId" value={fixedNeedId ?? i?.needId} />
                  <Input value={(() => { const n = needs.find((x) => x.id === (fixedNeedId ?? i?.needId)); return n ? `${needCodeLabel(n.needCode)} · ${n.title} (${n.departmentName})` : ""; })()} disabled />
                </>
              ) : (
                <Select id="needId" name="needId" required defaultValue="">
                  <option value="">— pilih kebutuhan —</option>
                  {needs.map((n) => (
                    <option key={n.id} value={n.id}>
                      {needCodeLabel(n.needCode)} · {n.title} ({n.departmentName})
                    </option>
                  ))}
                </Select>
              )}
            </Field>
            <Field label="Tujuan wawancara" htmlFor="objective" className="md:col-span-2">
              <Textarea id="objective" name="objective" defaultValue={i?.objective ?? ""} maxLength={4000} className="min-h-[72px]" />
            </Field>
            <Field label="Tanggal dan waktu" htmlFor="scheduledAt">
              <Input id="scheduledAt" name="scheduledAt" type="datetime-local" defaultValue={toDatetimeLocal(i?.scheduledAt)} />
            </Field>
            <Field label="Status" htmlFor="status" required>
              <Select id="status" name="status" defaultValue={i?.status ?? "planned"}>
                {Object.entries(INTERVIEW_STATUS_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Peserta dan pemilik proses" htmlFor="participants" className="md:col-span-2">
              <Textarea id="participants" name="participants" defaultValue={i?.participants ?? ""} maxLength={4000} className="min-h-[60px]" />
            </Field>
            <Field label="Pertanyaan klarifikasi" htmlFor="questions" className="md:col-span-2">
              <Textarea id="questions" name="questions" defaultValue={i?.questions ?? ""} maxLength={4000} />
            </Field>
            <Field label="Temuan dan bukti" htmlFor="findings" className="md:col-span-2">
              <Textarea id="findings" name="findings" defaultValue={i?.findings ?? ""} maxLength={4000} />
            </Field>
            <Field label="Proses saat ini dan target" htmlFor="currentVsTarget">
              <Textarea id="currentVsTarget" name="currentVsTarget" defaultValue={i?.currentVsTarget ?? ""} maxLength={4000} />
            </Field>
            <Field label="Volume / frekuensi / baseline terverifikasi" htmlFor="verifiedBaseline">
              <Textarea id="verifiedBaseline" name="verifiedBaseline" defaultValue={i?.verifiedBaseline ?? ""} maxLength={4000} />
            </Field>
            <Field label="Ketergantungan dan risiko" htmlFor="dependenciesRisks">
              <Textarea id="dependenciesRisks" name="dependenciesRisks" defaultValue={i?.dependenciesRisks ?? ""} maxLength={4000} />
            </Field>
            <Field label="Keputusan tindak lanjut" htmlFor="outcome">
              <Textarea id="outcome" name="outcome" defaultValue={i?.outcome ?? ""} maxLength={4000} />
            </Field>
            <Field label="Penanggung jawab" htmlFor="ownerUserId">
              <Select id="ownerUserId" name="ownerUserId" defaultValue={i?.ownerUserId ?? ""}>
                <option value="">— belum ditetapkan —</option>
                {staff.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.fullName}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Tenggat tindak lanjut" htmlFor="dueAt">
              <Input id="dueAt" name="dueAt" type="datetime-local" defaultValue={toDatetimeLocal(i?.dueAt)} />
            </Field>
            <Field label="Catatan / notulen" htmlFor="notes" className="md:col-span-2" hint="Lampiran notulen dapat diunggah pada halaman kebutuhan.">
              <Textarea id="notes" name="notes" defaultValue={i?.notes ?? ""} maxLength={4000} />
            </Field>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="sharedWithRespondent" defaultChecked={i?.sharedWithRespondent ?? false} className="h-4 w-4 accent-[var(--primary)]" />
            Bagikan ringkasan wawancara (jadwal, tujuan, peserta, keputusan) kepada responden Bagian terkait
          </label>
          <FormMessage message={state?.error} />
          <FormMessage message={state?.success} tone="success" />
          <div className="flex gap-2">
            <SubmitButton pendingText="Menyimpan…">Simpan wawancara</SubmitButton>
            <LinkButton href={backHref} variant="outline">
              Kembali
            </LinkButton>
          </div>
        </CardBody>
      </Card>
    </form>
  );
}
