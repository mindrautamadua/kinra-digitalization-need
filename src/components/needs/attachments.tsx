"use client";
import { useActionState } from "react";
import { archiveAttachmentAction, uploadAttachmentAction } from "@/actions/respond";
import { FormMessage, SubmitButton } from "@/components/ui/form";
import { Paperclip, Trash2 } from "lucide-react";
import { formatDate } from "@/lib/utils";

export type AttachmentRow = {
  id: string;
  originalFilename: string;
  mimeType: string;
  sizeBytes: number;
  createdAt: Date | string;
  archivedAt: Date | string | null;
  uploader?: { fullName: string } | null;
};

export function AttachmentPanel({ needId, attachments, canEdit, maxMb }: { needId: string; attachments: AttachmentRow[]; canEdit: boolean; maxMb: number }) {
  const [state, action] = useActionState(uploadAttachmentAction.bind(null, needId), undefined);
  const active = attachments.filter((a) => !a.archivedAt);
  return (
    <div className="space-y-3">
      {active.length === 0 ? (
        <p className="text-sm text-muted">Belum ada lampiran.</p>
      ) : (
        <ul className="divide-y divide-border rounded-md border border-border bg-surface">
          {active.map((a) => (
            <li key={a.id} className="flex items-center gap-3 px-3 py-2 text-sm">
              <Paperclip className="h-4 w-4 shrink-0 text-muted" aria-hidden />
              <a href={`/api/attachments/${a.id}`} className="min-w-0 flex-1 truncate text-primary hover:underline">
                {a.originalFilename}
              </a>
              <span className="hidden text-xs text-muted sm:inline">
                {(a.sizeBytes / 1024).toFixed(0)} KB · {formatDate(a.createdAt)}
                {a.uploader ? ` · ${a.uploader.fullName}` : ""}
              </span>
              {canEdit && (
                <form action={archiveAttachmentAction.bind(null, a.id)}>
                  <button type="submit" className="rounded p-1 text-muted hover:bg-red-50 hover:text-danger" aria-label="Arsipkan lampiran" title="Arsipkan lampiran">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </form>
              )}
            </li>
          ))}
        </ul>
      )}
      {canEdit && (
        <form action={action} className="space-y-2">
          <input
            type="file"
            name="file"
            required
            accept=".pdf,.png,.jpg,.jpeg,.xlsx,.docx,.pptx,.csv,.txt"
            className="block w-full text-sm file:mr-3 file:rounded-md file:border file:border-border file:bg-surface file:px-3 file:py-1.5 file:text-sm file:font-medium hover:file:bg-slate-50"
          />
          <p className="text-xs text-muted">PDF, PNG, JPG, XLSX, DOCX, PPTX, CSV, TXT · maks. {maxMb} MB. Samarkan data pribadi / rahasia yang tidak diperlukan.</p>
          <FormMessage message={state?.error} />
          <FormMessage message={state?.success} tone="success" />
          <SubmitButton size="sm" variant="outline" pendingText="Mengunggah…">
            Unggah lampiran
          </SubmitButton>
        </form>
      )}
    </div>
  );
}
