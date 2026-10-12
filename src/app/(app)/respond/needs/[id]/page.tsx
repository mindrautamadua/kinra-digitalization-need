import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth/guard";
import { loadNeedFor, RESPONDENT_EDITABLE } from "@/lib/queries/respond";
import { PageHeader, Card, CardBody, CardHeader } from "@/components/ui/card";
import { StatusBadge, Badge } from "@/components/ui/badge";
import { LinkButton } from "@/components/ui/button";
import { NeedDetail } from "@/components/needs/need-detail";
import { AttachmentPanel } from "@/components/needs/attachments";
import { ThreadPanel } from "@/components/needs/thread";
import { replyClarificationAction, deleteDraftNeedAction } from "@/actions/respond";
import { FormMessage, SubmitButton } from "@/components/ui/form";
import { formatDate } from "@/lib/utils";
import { INTERVIEW_STATUS_LABELS } from "@/lib/enums";

export default async function RespondentNeedPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ submitted?: string }> }) {
  const me = await requireRole("respondent");
  const { id } = await params;
  const sp = await searchParams;
  const need = await loadNeedFor(me, id);
  if (!need || need.status === "archived") notFound();
  const editable = RESPONDENT_EDITABLE.has(need.status) && need.submission.period.status === "active";
  const visibleThreads = need.threads.filter((t) => t.visibility === "respondent");
  const sharedInterviews = need.interviews.filter((i) => i.sharedWithRespondent);
  const maxMb = Number(process.env.MAX_UPLOAD_MB ?? 10);

  return (
    <>
      <PageHeader
        title={
          <span className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-base text-muted">{need.needCode}</span>
            <span>{need.title || "(tanpa judul)"}</span>
          </span>
        }
        description={`${need.submission.department.name} · Periode ${need.submission.period.name} · Dibuat ${formatDate(need.createdAt)}`}
        actions={
          <>
            <StatusBadge status={need.status} />
            {editable && <LinkButton href={`/respond/needs/${need.id}/edit`}>{need.status === "draft" ? "Lanjutkan pengisian" : "Perbaiki & kirim ulang"}</LinkButton>}
            <LinkButton href="/respond" variant="outline">
              Kembali
            </LinkButton>
          </>
        }
      />
      {sp.submitted && <div className="mb-4"><FormMessage tone="success" message="Kebutuhan berhasil dikirim. Tim Assessment TI akan menelaah dan menghubungi Anda bila diperlukan klarifikasi." /></div>}
      {need.statusReason && ["returned_for_revision", "clarification_required", "deferred", "rejected"].includes(need.status) && (
        <div className="mb-4">
          <FormMessage tone="info" message={`Catatan Tim Assessment: ${need.statusReason}`} />
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <NeedDetail need={need} />
        </div>
        <div className="space-y-4">
          <Card>
            <CardHeader title="Klarifikasi" description="Pertanyaan dari Tim Assessment TI dan balasan Anda." />
            <CardBody>
              <ThreadPanel threads={visibleThreads} action={replyClarificationAction.bind(null, need.id)} canPost={need.status !== "draft" && need.status !== "closed"} currentUserId={me.id} />
            </CardBody>
          </Card>
          <Card>
            <CardHeader title="Lampiran" />
            <CardBody>
              <AttachmentPanel needId={need.id} attachments={need.attachments} canEdit={editable} maxMb={maxMb} />
            </CardBody>
          </Card>
          {sharedInterviews.length > 0 && (
            <Card>
              <CardHeader title="Wawancara" description="Sesi wawancara yang dibagikan kepada Bagian Anda." />
              <CardBody className="space-y-3 text-sm">
                {sharedInterviews.map((i) => (
                  <div key={i.id} className="rounded-md border border-border p-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium">{formatDate(i.scheduledAt, true)}</span>
                      <Badge>{INTERVIEW_STATUS_LABELS[i.status]}</Badge>
                    </div>
                    {i.objective && <p className="mt-1 text-muted">{i.objective}</p>}
                    {i.participants && <p className="mt-1">Peserta: {i.participants}</p>}
                    {i.outcome && <p className="mt-1">Keputusan: {i.outcome}</p>}
                  </div>
                ))}
              </CardBody>
            </Card>
          )}
          {need.status === "draft" && !need.submittedAt && (
            <Card>
              <CardBody>
                <form action={deleteDraftNeedAction.bind(null, need.id)}>
                  <p className="mb-2 text-sm text-muted">Draft yang belum pernah dikirim dapat dihapus.</p>
                  <SubmitButton variant="danger" size="sm" pendingText="Menghapus…">
                    Hapus draft
                  </SubmitButton>
                </form>
              </CardBody>
            </Card>
          )}
        </div>
      </div>
    </>
  );
}
