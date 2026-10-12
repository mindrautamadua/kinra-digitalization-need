"use client";
import { useActionState, useState } from "react";
import { deleteUserAction, saveDepartmentAction, savePeriodAction, saveSettingsAction, saveUserAction } from "@/actions/admin";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Field, Input, Select, Textarea } from "@/components/ui/input";
import { FormMessage, SubmitButton } from "@/components/ui/form";
import { ROLE_LABELS, SCORE_CRITERIA } from "@/lib/enums";
import type { Department, User, AssessmentPeriod } from "@/lib/db/schema";
import type { ScoreThresholds, ScoreWeights } from "@/lib/scoring";
import { toDatetimeLocal } from "@/lib/utils";

export function DepartmentForm({ dept }: { dept?: Department | null }) {
  const [state, action] = useActionState(saveDepartmentAction.bind(null, dept?.id ?? null), undefined);
  const k = dept?.id ?? "new";
  return (
    <form action={action} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Kode" htmlFor={`code-${k}`} required>
          <Input id={`code-${k}`} name="code" defaultValue={dept?.code ?? ""} maxLength={32} required placeholder="mis. TI" />
        </Field>
        <Field label="Nama Bagian" htmlFor={`name-${k}`} required className="sm:col-span-2">
          <Input id={`name-${k}`} name="name" defaultValue={dept?.name ?? ""} maxLength={200} required />
        </Field>
      </div>
      <Field label="Deskripsi" htmlFor={`desc-${k}`}>
        <Textarea id={`desc-${k}`} name="description" defaultValue={dept?.description ?? ""} maxLength={2000} className="min-h-[60px]" />
      </Field>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="isActive" defaultChecked={dept?.isActive ?? true} className="h-4 w-4 accent-[var(--primary)]" /> Aktif
      </label>
      <FormMessage message={state?.error} />
      <FormMessage message={state?.success} tone="success" />
      <SubmitButton size="sm" pendingText="Menyimpan…">
        {dept ? "Simpan perubahan" : "Tambah Bagian"}
      </SubmitButton>
    </form>
  );
}

export function UserForm({ user, departments }: { user?: User | null; departments: Department[] }) {
  const [state, action] = useActionState(saveUserAction.bind(null, user?.id ?? null), undefined);
  const k = user?.id ?? "new";
  return (
    <form action={action} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Nama lengkap" htmlFor={`fullName-${k}`} required>
          <Input id={`fullName-${k}`} name="fullName" defaultValue={user?.fullName ?? ""} maxLength={200} required />
        </Field>
        <Field label="Email" htmlFor={`email-${k}`} required>
          <Input id={`email-${k}`} name="email" type="email" defaultValue={user?.email ?? ""} maxLength={255} required />
        </Field>
        <Field label="Jabatan" htmlFor={`jobTitle-${k}`}>
          <Input id={`jobTitle-${k}`} name="jobTitle" defaultValue={user?.jobTitle ?? ""} maxLength={200} />
        </Field>
        <Field label="Role" htmlFor={`role-${k}`} required>
          <Select id={`role-${k}`} name="role" defaultValue={user?.role ?? "respondent"}>
            {Object.entries(ROLE_LABELS).map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Bagian" htmlFor={`dept-${k}`} hint="Wajib untuk responden.">
          <Select id={`dept-${k}`} name="departmentId" defaultValue={user?.departmentId ?? ""}>
            <option value="">— tidak ada —</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.code} · {d.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label={user ? "Reset kata sandi (opsional)" : "Kata sandi awal"} htmlFor={`password-${k}`} required={!user} hint="Min. 8 karakter, huruf dan angka. Pengguna wajib menggantinya saat login.">
          <Input id={`password-${k}`} name="password" type="password" autoComplete="new-password" minLength={user ? undefined : 8} required={!user} />
        </Field>
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="isActive" defaultChecked={user?.isActive ?? true} className="h-4 w-4 accent-[var(--primary)]" /> Akun aktif
      </label>
      <FormMessage message={state?.error} />
      <FormMessage message={state?.success} tone="success" />
      <SubmitButton size="sm" pendingText="Menyimpan…">
        {user ? "Simpan perubahan" : "Tambah pengguna"}
      </SubmitButton>
    </form>
  );
}

export function DeleteUserForm({ user }: { user: User }) {
  const [state, action] = useActionState(deleteUserAction.bind(null, user.id), undefined);
  const [open, setOpen] = useState(false);
  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="text-xs text-muted hover:text-danger hover:underline">
        Hapus pengguna ini…
      </button>
    );
  }
  return (
    <form action={action} className="space-y-2">
      <p className="text-xs text-danger">
        Akun dihapus permanen beserta sesi dan notifikasinya. Data yang pernah dibuat pengguna tetap ada tanpa nama pembuat. Pertimbangkan menonaktifkan akun bila hanya perlu memblokir akses.
      </p>
      <Input name="confirmEmail" placeholder={`Ketik ${user.email} untuk konfirmasi`} autoComplete="off" required aria-label="Konfirmasi email" />
      <FormMessage message={state?.error} />
      <div className="flex gap-2">
        <SubmitButton size="sm" variant="danger" pendingText="Menghapus…">
          Hapus permanen
        </SubmitButton>
        <button type="button" onClick={() => setOpen(false)} className="text-xs text-muted hover:underline">
          Batal
        </button>
      </div>
    </form>
  );
}

export function PeriodForm({ period, departments, selected }: { period?: AssessmentPeriod | null; departments: Department[]; selected: string[] }) {
  const [state, action] = useActionState(savePeriodAction.bind(null, period?.id ?? null), undefined);
  return (
    <form action={action} className="space-y-4">
      <Card>
        <CardHeader title={period ? "Data periode" : "Periode assessment baru"} />
        <CardBody className="space-y-4">
          <Field label="Nama periode" htmlFor="name" required>
            <Input id="name" name="name" defaultValue={period?.name ?? ""} maxLength={200} required placeholder="Assessment Digitalisasi 2026" />
          </Field>
          <Field label="Deskripsi" htmlFor="description">
            <Textarea id="description" name="description" defaultValue={period?.description ?? ""} maxLength={2000} className="min-h-[60px]" />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Tanggal mulai" htmlFor="startAt" required>
              <Input id="startAt" name="startAt" type="datetime-local" defaultValue={toDatetimeLocal(period?.startAt)} required />
            </Field>
            <Field label="Tenggat" htmlFor="dueAt" required>
              <Input id="dueAt" name="dueAt" type="datetime-local" defaultValue={toDatetimeLocal(period?.dueAt)} required />
            </Field>
          </div>
          <Field label="Bagian yang ditetapkan ikut assessment" hint="Bagian yang sudah memiliki respons tidak dapat dilepas.">
            <div className="grid gap-2 sm:grid-cols-2">
              {departments
                .filter((d) => d.isActive || selected.includes(d.id))
                .map((d) => (
                  <label key={d.id} className="flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm">
                    <input type="checkbox" name="departmentIds" value={d.id} defaultChecked={selected.includes(d.id)} className="h-4 w-4 accent-[var(--primary)]" />
                    <span className="font-mono text-xs text-muted">{d.code}</span> {d.name}
                  </label>
                ))}
            </div>
          </Field>
          <FormMessage message={state?.error} />
          <FormMessage message={state?.success} tone="success" />
          <SubmitButton pendingText="Menyimpan…">{period ? "Simpan periode" : "Buat periode"}</SubmitButton>
        </CardBody>
      </Card>
    </form>
  );
}

export function SettingsForm({ weights, thresholds, allowRespondentExport, mgmtDetails }: { weights: ScoreWeights; thresholds: ScoreThresholds; allowRespondentExport: boolean; mgmtDetails: boolean }) {
  const [state, action] = useActionState(saveSettingsAction, undefined);
  return (
    <form action={action} className="space-y-4">
      <Card>
        <CardHeader title="Bobot skor prioritas" description="Total harus 100. Skala nilai tiap kriteria 1–5; skor = Σ (nilai ÷ 5 × bobot)." />
        <CardBody className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {SCORE_CRITERIA.map((c) => (
            <Field key={c.key} label={c.label} htmlFor={`w_${c.key}`}>
              <Input id={`w_${c.key}`} name={`w_${c.key}`} type="number" min={0} max={100} step={1} defaultValue={weights[c.key]} required />
            </Field>
          ))}
        </CardBody>
      </Card>
      <Card>
        <CardHeader title="Ambang kategori prioritas" description="Skor minimal untuk tiap kategori (0–100)." />
        <CardBody className="grid gap-4 sm:grid-cols-3">
          <Field label="Sangat tinggi ≥" htmlFor="t_veryHigh">
            <Input id="t_veryHigh" name="t_veryHigh" type="number" min={0} max={100} defaultValue={thresholds.veryHigh} required />
          </Field>
          <Field label="Tinggi ≥" htmlFor="t_high">
            <Input id="t_high" name="t_high" type="number" min={0} max={100} defaultValue={thresholds.high} required />
          </Field>
          <Field label="Menengah ≥" htmlFor="t_medium">
            <Input id="t_medium" name="t_medium" type="number" min={0} max={100} defaultValue={thresholds.medium} required />
          </Field>
        </CardBody>
      </Card>
      <Card>
        <CardHeader title="Hak akses tambahan" />
        <CardBody className="space-y-3">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="allow_respondent_export" defaultChecked={allowRespondentExport} className="h-4 w-4 accent-[var(--primary)]" />
            Responden boleh mengekspor register milik Bagiannya sendiri
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="management_can_view_details" defaultChecked={mgmtDetails} className="h-4 w-4 accent-[var(--primary)]" />
            Manajemen dapat melihat detail kebutuhan, lampiran, dan mengekspor (bukan hanya dashboard)
          </label>
          <FormMessage message={state?.error} />
          <FormMessage message={state?.success} tone="success" />
          <SubmitButton pendingText="Menyimpan…">Simpan pengaturan</SubmitButton>
        </CardBody>
      </Card>
    </form>
  );
}
