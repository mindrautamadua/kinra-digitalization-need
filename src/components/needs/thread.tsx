"use client";
import { useActionState } from "react";
import { FormMessage, SubmitButton } from "@/components/ui/form";
import { Textarea } from "@/components/ui/input";
import { ROLE_LABELS } from "@/lib/enums";
import { formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";
import type { FormState } from "@/actions/respond";

export type ThreadRow = {
  id: string;
  message: string;
  visibility: "respondent" | "internal";
  createdAt: Date | string;
  author?: { id: string; fullName: string; role: string } | null;
};

export function ThreadPanel({
  threads,
  action,
  canPost,
  allowInternal,
  currentUserId,
}: {
  threads: ThreadRow[];
  action: (prev: FormState, fd: FormData) => Promise<FormState>;
  canPost: boolean;
  allowInternal?: boolean;
  currentUserId: string;
}) {
  const [state, formAction] = useActionState(action, undefined);
  return (
    <div className="space-y-4">
      {threads.length === 0 ? (
        <p className="text-sm text-muted">Belum ada percakapan klarifikasi.</p>
      ) : (
        <ul className="space-y-3">
          {threads.map((t) => {
            const mine = t.author?.id === currentUserId;
            return (
              <li key={t.id} className={cn("rounded-md border px-3 py-2 text-sm", t.visibility === "internal" ? "border-amber-200 bg-amber-50" : mine ? "border-accent bg-accent" : "border-border bg-surface")}>
                <div className="mb-1 flex flex-wrap items-center gap-x-2 text-xs text-muted">
                  <span className="font-medium text-foreground">{t.author?.fullName ?? "Pengguna"}</span>
                  <span>{t.author ? ROLE_LABELS[t.author.role] : ""}</span>
                  <span>· {formatDate(t.createdAt, true)}</span>
                  {t.visibility === "internal" && <span className="rounded bg-amber-200 px-1.5 py-0.5 font-medium text-amber-900">Internal</span>}
                </div>
                <p className="whitespace-pre-wrap">{t.message}</p>
              </li>
            );
          })}
        </ul>
      )}
      {canPost && (
        <form action={formAction} className="space-y-2">
          <Textarea name="message" required maxLength={4000} placeholder="Tulis pesan klarifikasi…" />
          {allowInternal && (
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="internal" className="h-4 w-4 accent-[var(--primary)]" /> Catatan internal (tidak terlihat oleh responden)
            </label>
          )}
          <FormMessage message={state?.error} />
          <FormMessage message={state?.success} tone="success" />
          <SubmitButton size="sm" pendingText="Mengirim…">
            Kirim pesan
          </SubmitButton>
        </form>
      )}
    </div>
  );
}
