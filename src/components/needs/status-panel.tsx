"use client";
import { useActionState, useState } from "react";
import { archiveNeedAction, changeStatusAction } from "@/actions/review";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Field, Select, Textarea } from "@/components/ui/input";
import { FormMessage, SubmitButton } from "@/components/ui/form";
import { StatusBadge } from "@/components/ui/badge";
import { NEED_STATUS_LABELS } from "@/lib/enums";
import { REASON_REQUIRED, STAFF_TRANSITIONS } from "@/lib/workflow";
import type { NeedStatus } from "@/lib/db/schema";

export function StatusPanel({ needId, status, statusReason }: { needId: string; status: NeedStatus; statusReason: string | null }) {
  const [state, action] = useActionState(changeStatusAction.bind(null, needId), undefined);
  const [aState, aAction] = useActionState(archiveNeedAction.bind(null, needId), undefined);
  const options = STAFF_TRANSITIONS[status] ?? [];
  const [to, setTo] = useState<string>(options[0] ?? "");
  const [showArchive, setShowArchive] = useState(false);
  const reasonRequired = REASON_REQUIRED.includes(to as NeedStatus);
  return (
    <Card>
      <CardHeader title="Status workflow" actions={<StatusBadge status={status} />} />
      <CardBody className="space-y-4">
        {statusReason && (
          <p className="rounded-md bg-slate-50 px-3 py-2 text-sm">
            <span className="text-muted">Alasan terakhir:</span> {statusReason}
          </p>
        )}
        {options.length === 0 ? (
          <p className="text-sm text-muted">{status === "returned_for_revision" ? "Menunggu responden mengirim ulang." : "Tidak ada transisi yang tersedia."}</p>
        ) : (
          <form action={action} className="space-y-3">
            <Field label="Ubah status menjadi" htmlFor="status">
              <Select id="status" name="status" value={to} onChange={(e) => setTo(e.target.value)}>
                {options.map((s) => (
                  <option key={s} value={s}>
                    {NEED_STATUS_LABELS[s]}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Alasan / catatan" htmlFor="reason" required={reasonRequired} hint={to === "clarification_required" ? "Akan dikirim ke responden sebagai pesan klarifikasi." : undefined}>
              <Textarea id="reason" name="reason" maxLength={4000} className="min-h-[72px]" required={reasonRequired} />
            </Field>
            <FormMessage message={state?.error} />
            <FormMessage message={state?.success} tone="success" />
            <SubmitButton size="sm" pendingText="Menyimpan…">
              Terapkan status
            </SubmitButton>
          </form>
        )}
        <div className="border-t border-border pt-3">
          {!showArchive ? (
            <button type="button" onClick={() => setShowArchive(true)} className="text-xs text-muted hover:text-danger hover:underline">
              Arsipkan / void kebutuhan ini…
            </button>
          ) : (
            <form action={aAction} className="space-y-2">
              <p className="text-xs text-danger">Kebutuhan tidak dihapus permanen; status menjadi Archived dan tercatat di audit trail.</p>
              <Textarea name="reason" placeholder="Alasan pengarsipan (wajib)" required maxLength={4000} className="min-h-[60px]" />
              <FormMessage message={aState?.error} />
              <div className="flex gap-2">
                <SubmitButton size="sm" variant="danger" pendingText="Mengarsipkan…">
                  Arsipkan
                </SubmitButton>
                <button type="button" onClick={() => setShowArchive(false)} className="text-xs text-muted hover:underline">
                  Batal
                </button>
              </div>
            </form>
          )}
        </div>
      </CardBody>
    </Card>
  );
}
