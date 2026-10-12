"use client";
import { useActionState } from "react";
import { saveProfileAction } from "@/actions/respond";
import { Card, CardBody } from "@/components/ui/card";
import { Field, Input, Select, Textarea, RadioGroup } from "@/components/ui/input";
import { FormMessage, SubmitButton } from "@/components/ui/form";
import { LinkButton } from "@/components/ui/button";
import { USERS_RANGE, WORK_MODE } from "@/lib/enums";
import { useState } from "react";

type Defaults = {
  respondentName: string;
  respondentJobTitle: string;
  processOwnerName: string;
  estimatedUsersRange: string;
  mainProcesses: string;
  mainServices: string;
  currentSystems: string;
  dominantWorkMode: string;
  attestation: boolean;
};

export function ProfileForm({ periodId, departmentName, defaults }: { periodId: string; departmentName: string; defaults: Defaults }) {
  const [state, action] = useActionState(saveProfileAction.bind(null, periodId), undefined);
  const [workMode, setWorkMode] = useState(defaults.dominantWorkMode);
  const fe = state?.fieldErrors ?? {};
  return (
    <form action={action} className="space-y-6">
      <Card>
        <CardBody className="space-y-5">
          <Field label="Nama Bagian" htmlFor="dept">
            <Input id="dept" value={departmentName} disabled />
          </Field>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Nama responden" htmlFor="respondentName" required error={fe.respondentName}>
              <Input id="respondentName" name="respondentName" defaultValue={defaults.respondentName} maxLength={200} required />
            </Field>
            <Field label="Jabatan responden" htmlFor="respondentJobTitle" required error={fe.respondentJobTitle}>
              <Input id="respondentJobTitle" name="respondentJobTitle" defaultValue={defaults.respondentJobTitle} maxLength={200} required />
            </Field>
            <Field label="Nama pejabat / pemilik proses" htmlFor="processOwnerName" required hint="Dapat sama dengan responden." error={fe.processOwnerName}>
              <Input id="processOwnerName" name="processOwnerName" defaultValue={defaults.processOwnerName} maxLength={200} required />
            </Field>
            <Field label="Perkiraan jumlah pengguna yang terlibat" htmlFor="estimatedUsersRange" error={fe.estimatedUsersRange}>
              <Select id="estimatedUsersRange" name="estimatedUsersRange" defaultValue={defaults.estimatedUsersRange}>
                <option value="">— pilih —</option>
                {USERS_RANGE.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
          <Field label="Proses utama Bagian" htmlFor="mainProcesses" required hint="Contoh: pengelolaan kontrak sewa, penagihan utilitas, pemeliharaan jalan kawasan." error={fe.mainProcesses}>
            <Textarea id="mainProcesses" name="mainProcesses" defaultValue={defaults.mainProcesses} maxLength={4000} required />
          </Field>
          <Field label="Layanan utama yang diberikan dan penerimanya" htmlFor="mainServices" hint="Contoh: layanan pengaduan tenant (penerima: tenant), laporan bulanan (penerima: Direksi)." error={fe.mainServices}>
            <Textarea id="mainServices" name="mainServices" defaultValue={defaults.mainServices} maxLength={4000} />
          </Field>
          <Field label="Sistem / aplikasi yang digunakan saat ini" htmlFor="currentSystems" hint="Sebutkan nama aplikasi, spreadsheet, atau sistem lain yang dipakai." error={fe.currentSystems}>
            <Textarea id="currentSystems" name="currentSystems" defaultValue={defaults.currentSystems} maxLength={4000} />
          </Field>
          <Field label="Cara kerja yang dominan" error={fe.dominantWorkMode}>
            <RadioGroup name="dominantWorkMode" options={WORK_MODE} value={workMode} onChange={setWorkMode} inline />
          </Field>
          <label className="flex items-start gap-3 rounded-md border border-border bg-slate-50 p-3 text-sm">
            <input type="checkbox" name="attestation" defaultChecked={defaults.attestation} className="mt-0.5 h-4 w-4 accent-[var(--primary)]" />
            <span>
              Saya menyatakan bahwa informasi yang dikirim melalui assessment ini telah ditinjau secara wajar oleh Bagian kami.
              <span className="ml-1 text-danger">*</span>
            </span>
          </label>
          <FormMessage message={state?.error} />
          <FormMessage message={state?.success} tone="success" />
          <div className="flex flex-wrap gap-2">
            <SubmitButton pendingText="Menyimpan…">Simpan Profil</SubmitButton>
            <LinkButton href="/respond" variant="outline">
              Kembali
            </LinkButton>
          </div>
        </CardBody>
      </Card>
    </form>
  );
}
