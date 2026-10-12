import Link from "next/link";
import { requireRole } from "@/lib/auth/guard";
import { activePeriodsForDepartment, needsForSubmission, submissionFor } from "@/lib/queries/respond";
import { Card, CardBody, CardHeader, EmptyState, PageHeader } from "@/components/ui/card";
import { LinkButton } from "@/components/ui/button";
import { StatusBadge, UrgencyBadge, Badge } from "@/components/ui/badge";
import { Table, THead, TH, TD } from "@/components/ui/table";
import { formatDate } from "@/lib/utils";
import { createNeedAction } from "@/actions/respond";
import { SubmitButton } from "@/components/ui/form";
import { AlertTriangle, CheckCircle2 } from "lucide-react";

export const metadata = { title: "Assessment Bagian Saya" };

export default async function RespondPage() {
  const me = await requireRole("respondent");
  if (!me.departmentId) {
    return (
      <EmptyState
        title="Akun belum terhubung ke Bagian"
        description="Hubungi Administrator TI agar akun Anda dikaitkan dengan Bagian yang benar sebelum mengisi assessment."
      />
    );
  }
  const periods = await activePeriodsForDepartment(me.departmentId);

  return (
    <>
      <PageHeader
        title="Assessment Bagian Saya"
        description={`${me.departmentName ?? ""} · Lengkapi profil Bagian, lalu tambahkan satu atau lebih kebutuhan digitalisasi.`}
      />
      {periods.length === 0 && (
        <EmptyState
          title="Belum ada periode assessment aktif"
          description="Saat Administrator TI mengaktifkan periode assessment untuk Bagian Anda, formulir akan muncul di sini."
        />
      )}
      <div className="space-y-8">
        {await Promise.all(
          periods.map(async (period) => {
            const sub = await submissionFor(period.id, me.departmentId!);
            const needs = sub ? await needsForSubmission(sub.id) : [];
            const profileComplete = Boolean(sub?.attestation && sub?.mainProcesses && sub?.processOwnerName && sub?.respondentJobTitle);
            const overdue = period.dueAt < new Date();
            return (
              <section key={period.id} className="space-y-4">
                <Card>
                  <CardHeader
                    title={period.name}
                    description={
                      <>
                        Tenggat: <span className={overdue ? "font-medium text-danger" : "font-medium"}>{formatDate(period.dueAt, true)}</span>
                        {period.description ? ` · ${period.description}` : ""}
                      </>
                    }
                    actions={
                      <LinkButton href={`/respond/profile?period=${period.id}`} variant={profileComplete ? "outline" : "primary"}>
                        {profileComplete ? "Edit Profil Bagian" : "Isi Profil Bagian (Form A)"}
                      </LinkButton>
                    }
                  />
                  <CardBody className="flex flex-wrap items-center gap-3 text-sm">
                    {profileComplete ? (
                      <span className="inline-flex items-center gap-1.5 text-success">
                        <CheckCircle2 className="h-4 w-4" /> Profil Bagian lengkap
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-warning">
                        <AlertTriangle className="h-4 w-4" /> Profil Bagian belum lengkap — wajib sebelum mengirim kebutuhan
                      </span>
                    )}
                    <span className="text-muted">·</span>
                    <span>
                      {needs.length} kebutuhan · {needs.filter((n) => n.status !== "draft").length} sudah dikirim
                    </span>
                  </CardBody>
                </Card>

                <Card>
                  <CardHeader
                    title="Kebutuhan Digitalisasi (Form B)"
                    description="Satu kebutuhan = satu rekaman. Setiap kebutuhan dinilai dan dilacak secara terpisah."
                    actions={
                      <form action={createNeedAction.bind(null, period.id)}>
                        <SubmitButton pendingText="Membuat…">+ Tambah Kebutuhan</SubmitButton>
                      </form>
                    }
                  />
                  <CardBody className="p-0">
                    {needs.length === 0 ? (
                      <div className="px-5 py-8 text-center text-sm text-muted">Belum ada kebutuhan. Klik “Tambah Kebutuhan” untuk memulai.</div>
                    ) : (
                      <Table className="border-0">
                        <THead>
                          <tr>
                            <TH>Kode</TH>
                            <TH>Judul</TH>
                            <TH>Urgensi</TH>
                            <TH>Status</TH>
                            <TH>Diperbarui</TH>
                            <TH></TH>
                          </tr>
                        </THead>
                        <tbody>
                          {needs.map((n) => (
                            <tr key={n.id} className="hover:bg-slate-50">
                              <TD className="font-mono text-xs">{n.needCode}</TD>
                              <TD>
                                <Link href={`/respond/needs/${n.id}`} className="font-medium text-primary hover:underline">
                                  {n.title || <span className="text-muted italic">(tanpa judul)</span>}
                                </Link>
                                {n.review?.criticalFlag && (
                                  <Badge tone="red" className="ml-2">
                                    Risiko kritis
                                  </Badge>
                                )}
                              </TD>
                              <TD>
                                <UrgencyBadge value={n.respondentUrgency} />
                              </TD>
                              <TD>
                                <StatusBadge status={n.status} />
                              </TD>
                              <TD className="whitespace-nowrap text-muted">{formatDate(n.updatedAt, true)}</TD>
                              <TD className="text-right whitespace-nowrap">
                                {["draft", "returned_for_revision", "clarification_required"].includes(n.status) && period.status === "active" ? (
                                  <Link href={`/respond/needs/${n.id}/edit`} className="text-sm text-primary hover:underline">
                                    {n.status === "draft" ? "Lanjutkan" : "Perbaiki"}
                                  </Link>
                                ) : (
                                  <Link href={`/respond/needs/${n.id}`} className="text-sm text-primary hover:underline">
                                    Lihat
                                  </Link>
                                )}
                              </TD>
                            </tr>
                          ))}
                        </tbody>
                      </Table>
                    )}
                  </CardBody>
                </Card>
              </section>
            );
          }),
        )}
      </div>
    </>
  );
}
