import { notFound, redirect } from "next/navigation";
import { requireRole } from "@/lib/auth/guard";
import { loadNeedFor, RESPONDENT_EDITABLE } from "@/lib/queries/respond";
import { PageHeader } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/badge";
import { NeedForm } from "@/components/needs/need-form";
import { AttachmentPanel } from "@/components/needs/attachments";
import { FormMessage } from "@/components/ui/form";

export const metadata = { title: "Formulir Kebutuhan" };

export default async function EditNeedPage({ params }: { params: Promise<{ id: string }> }) {
  const me = await requireRole("respondent");
  const { id } = await params;
  const need = await loadNeedFor(me, id);
  if (!need || need.status === "archived") notFound();
  if (!RESPONDENT_EDITABLE.has(need.status) || need.submission.period.status !== "active") redirect(`/respond/needs/${id}`);
  const maxMb = Number(process.env.MAX_UPLOAD_MB ?? 10);
  const { submission, review, attachments, threads, interviews, ...plain } = need;
  void submission; void review; void threads; void interviews;
  return (
    <>
      <PageHeader
        title={
          <span className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-base text-muted">{need.needCode}</span>
            <span>Form B — Kebutuhan Digitalisasi</span>
          </span>
        }
        description={`${need.submission.department.name} · Periode ${need.submission.period.name} · Perkiraan waktu pengisian 10–15 menit.`}
        actions={<StatusBadge status={need.status} />}
      />
      {need.statusReason && need.status !== "draft" && (
        <div className="mb-4">
          <FormMessage tone="info" message={`Catatan Tim Assessment: ${need.statusReason}`} />
        </div>
      )}
      <NeedForm need={plain} attachmentsSlot={<AttachmentPanel needId={need.id} attachments={attachments} canEdit maxMb={maxMb} />} />
    </>
  );
}
