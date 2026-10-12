import Link from "next/link";
import { requireRole } from "@/lib/auth/guard";
import { listInterviews } from "@/lib/queries/interviews";
import { PageHeader, EmptyState } from "@/components/ui/card";
import { LinkButton } from "@/components/ui/button";
import { Table, THead, TH, TD } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { INTERVIEW_STATUS_LABELS } from "@/lib/enums";
import { formatDate, truncate } from "@/lib/utils";

export const metadata = { title: "Interview Tracker" };

export default async function InterviewsPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  await requireRole("admin", "assessment_reviewer");
  const { status } = await searchParams;
  const rows = await listInterviews(status && status in INTERVIEW_STATUS_LABELS ? status : undefined);
  return (
    <>
      <PageHeader title="Interview Tracker" description="Sesi wawancara terarah untuk kebutuhan yang belum jelas atau berdampak tinggi." actions={<LinkButton href="/interviews/new">+ Wawancara baru</LinkButton>} />
      <div className="mb-4 flex flex-wrap gap-2 text-sm">
        <Link href="/interviews" className={`rounded-full border px-3 py-1 ${!status ? "border-primary bg-accent text-primary" : "border-border"}`}>
          Semua
        </Link>
        {Object.entries(INTERVIEW_STATUS_LABELS).map(([k, v]) => (
          <Link key={k} href={`/interviews?status=${k}`} className={`rounded-full border px-3 py-1 ${status === k ? "border-primary bg-accent text-primary" : "border-border"}`}>
            {v}
          </Link>
        ))}
      </div>
      {rows.length === 0 ? (
        <EmptyState title="Belum ada wawancara" description="Buat sesi wawancara dari halaman detail kebutuhan atau tombol di atas." />
      ) : (
        <Table>
          <THead>
            <tr>
              <TH>Jadwal</TH>
              <TH>Kebutuhan</TH>
              <TH>Bagian</TH>
              <TH>Tujuan</TH>
              <TH>PJ</TH>
              <TH>Tenggat</TH>
              <TH>Status</TH>
            </tr>
          </THead>
          <tbody>
            {rows.map((i) => (
              <tr key={i.id} className="hover:bg-slate-50">
                <TD className="whitespace-nowrap">
                  <Link href={`/interviews/${i.id}`} className="font-medium text-primary hover:underline">
                    {i.scheduledAt ? formatDate(i.scheduledAt, true) : "(belum dijadwalkan)"}
                  </Link>
                </TD>
                <TD>
                  <Link href={`/needs/${i.need.id}`} className="hover:underline">
                    <span className="font-mono text-xs">{i.need.needCode}</span> {truncate(i.need.title, 50)}
                  </Link>
                </TD>
                <TD className="whitespace-nowrap">{i.need.submission.department.name}</TD>
                <TD className="text-xs text-muted">{truncate(i.objective, 80)}</TD>
                <TD className="whitespace-nowrap text-xs">{i.owner?.fullName ?? "-"}</TD>
                <TD className="whitespace-nowrap text-xs">{formatDate(i.dueAt)}</TD>
                <TD>
                  <Badge tone={i.status === "completed" ? "green" : i.status === "follow_up_required" ? "amber" : i.status === "scheduled" ? "violet" : "gray"}>{INTERVIEW_STATUS_LABELS[i.status]}</Badge>
                </TD>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
    </>
  );
}
