import Link from "next/link";
import { notFound } from "next/navigation";
import { inArray } from "drizzle-orm";
import { requireRole, isStaff } from "@/lib/auth/guard";
import { loadNeedFor } from "@/lib/queries/respond";
import { db } from "@/lib/db";
import { digitalNeeds } from "@/lib/db/schema";
import { getSetting } from "@/lib/settings";
import { PageHeader, Card, CardBody, CardHeader, DescriptionList } from "@/components/ui/card";
import { StatusBadge, Badge } from "@/components/ui/badge";
import { Printer } from "lucide-react";
import { LinkButton, buttonClass } from "@/components/ui/button";
import { NeedDetail } from "@/components/needs/need-detail";
import { AttachmentPanel } from "@/components/needs/attachments";
import { ThreadPanel } from "@/components/needs/thread";
import { ReviewForm } from "@/components/needs/review-form";
import { StatusPanel } from "@/components/needs/status-panel";
import { postClarificationAction } from "@/actions/review";
import { formatDate, needCodeLabel } from "@/lib/utils";
import { INTERVIEW_STATUS_LABELS, USERS_RANGE, WORK_MODE, labelOf } from "@/lib/enums";
import { priorityCategory, scoreBreakdown } from "@/lib/scoring";
import { SCORE_CRITERIA } from "@/lib/enums";

export default async function StaffNeedPage({ params }: { params: Promise<{ id: string }> }) {
  const me = await requireRole("admin", "assessment_reviewer", "management_viewer");
  const { id } = await params;
  const need = await loadNeedFor(me, id);
  if (!need) notFound();
  const staff = isStaff(me);
  const [weights, thresholds, mgmtDetails] = await Promise.all([getSetting("score_weights"), getSetting("score_thresholds"), getSetting("management_can_view_details")]);
  if (!staff && !mgmtDetails) {
    return (
      <>
        <PageHeader title={needCodeLabel(need.needCode)} />
        <p className="text-sm text-muted">Akses detail kebutuhan untuk Manajemen tidak diaktifkan. Hubungi Administrator TI.</p>
      </>
    );
  }
  const relatedCodes = need.review?.relatedNeedIds?.length
    ? (await db.query.digitalNeeds.findMany({ where: inArray(digitalNeeds.id, need.review.relatedNeedIds), columns: { needCode: true, id: true, title: true } }))
    : [];
  const maxMb = Number(process.env.MAX_UPLOAD_MB ?? 10);
  const score = need.review?.weightedScore == null ? null : Number(need.review.weightedScore);
  const cat = priorityCategory(score, thresholds);
  const sub = need.submission;

  return (
    <>
      <PageHeader
        title={
          <span className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-base text-muted">{needCodeLabel(need.needCode)}</span>
            <span>{need.title || "(tanpa judul)"}</span>
          </span>
        }
        description={`${sub.department.name} · Periode ${sub.period.name} · Submit ${formatDate(need.submittedAt, true)} · Update ${formatDate(need.updatedAt, true)}`}
        actions={
          <>
            {need.review?.criticalFlag && <Badge tone="red">Risiko kritis</Badge>}
            {score != null && (
              <Badge tone={cat.tone}>
                Skor {score.toFixed(1)} · {cat.label}
              </Badge>
            )}
            <StatusBadge status={need.status} />
            {staff && (
              <LinkButton href={`/interviews/new?need=${need.id}`} variant="secondary" size="sm">
                + Wawancara
              </LinkButton>
            )}
            {staff && (
              <LinkButton href={`/needs/${need.id}/edit`} variant="outline" size="sm">
                Koreksi isi
              </LinkButton>
            )}
            <a href={`/api/needs/${need.id}/pdf`} target="_blank" rel="noopener" className={buttonClass("outline", "sm")}>
              <Printer className="h-4 w-4" /> Cetak PDF
            </a>
            <LinkButton href="/needs" variant="outline" size="sm">
              Register
            </LinkButton>
          </>
        }
      />

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="space-y-4 xl:col-span-2">
          <Card>
            <CardHeader title="Profil Bagian (Form A)" />
            <CardBody>
              <DescriptionList
                columns={3}
                items={[
                  { label: "Responden", value: `${sub.respondentName ?? sub.respondent?.fullName ?? "-"}${sub.respondentJobTitle ? ` · ${sub.respondentJobTitle}` : ""}` },
                  { label: "Pemilik proses", value: sub.processOwnerName },
                  { label: "Pengguna terlibat", value: labelOf(USERS_RANGE, sub.estimatedUsersRange) },
                  { label: "Proses utama", value: sub.mainProcesses },
                  { label: "Sistem saat ini", value: sub.currentSystems },
                  { label: "Cara kerja dominan", value: labelOf(WORK_MODE, sub.dominantWorkMode) },
                ]}
              />
            </CardBody>
          </Card>
          <NeedDetail need={need} />
          {staff ? (
            <ReviewForm needId={need.id} review={need.review ?? null} relatedCodes={relatedCodes.flatMap((r) => (r.needCode ? [r.needCode] : []))} domainTags={need.domainTags} weights={weights} thresholds={thresholds} />
          ) : (
            need.review && (
              <Card>
                <CardHeader title="Hasil review dan skor" />
                <CardBody>
                  <DescriptionList
                    items={[
                      { label: "Skor berbobot", value: score == null ? "-" : `${score.toFixed(2)} (${cat.label})` },
                      { label: "Reviewer", value: need.review.reviewer?.fullName },
                      ...scoreBreakdown(need.review, weights).map((b) => ({
                        label: SCORE_CRITERIA.find((c) => c.key === b.key)?.label ?? b.key,
                        value: b.value == null ? "-" : `${b.value}/5 × ${b.weight}% = ${b.contribution}`,
                      })),
                      { label: "Alasan skor", value: need.review.scoreReason },
                      { label: "Catatan reviewer", value: need.review.reviewerNotes },
                    ]}
                  />
                </CardBody>
              </Card>
            )
          )}
        </div>
        <div className="space-y-4">
          {staff && <StatusPanel needId={need.id} status={need.status} statusReason={need.statusReason} />}
          {relatedCodes.length > 0 && (
            <Card>
              <CardHeader title="Kebutuhan terkait" />
              <CardBody className="space-y-1 text-sm">
                {relatedCodes.map((r) => (
                  <Link key={r.id} href={`/needs/${r.id}`} className="block text-primary hover:underline">
                    <span className="font-mono text-xs">{needCodeLabel(r.needCode)}</span> {r.title}
                  </Link>
                ))}
              </CardBody>
            </Card>
          )}
          <Card>
            <CardHeader title="Wawancara" actions={staff && <Link href={`/interviews/new?need=${need.id}`} className="text-xs text-primary hover:underline">+ Buat</Link>} />
            <CardBody className="space-y-2 text-sm">
              {need.interviews.length === 0 ? (
                <p className="text-muted">Belum ada sesi wawancara.</p>
              ) : (
                need.interviews.map((i) => (
                  <Link key={i.id} href={`/interviews/${i.id}`} className="block rounded-md border border-border p-3 hover:bg-slate-50">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium">{formatDate(i.scheduledAt, true)}</span>
                      <Badge>{INTERVIEW_STATUS_LABELS[i.status]}</Badge>
                    </div>
                    {i.objective && <p className="mt-1 text-muted">{i.objective}</p>}
                    <p className="mt-1 text-xs text-muted">PJ: {i.owner?.fullName ?? "-"}</p>
                  </Link>
                ))
              )}
            </CardBody>
          </Card>
          <Card>
            <CardHeader title="Klarifikasi" description="Pesan ke responden atau catatan internal tim." />
            <CardBody>
              <ThreadPanel threads={need.threads} action={postClarificationAction.bind(null, need.id)} canPost={staff} allowInternal currentUserId={me.id} />
            </CardBody>
          </Card>
          <Card>
            <CardHeader title="Lampiran" />
            <CardBody>
              <AttachmentPanel needId={need.id} attachments={need.attachments} canEdit={staff} maxMb={maxMb} />
            </CardBody>
          </Card>
        </div>
      </div>
    </>
  );
}
