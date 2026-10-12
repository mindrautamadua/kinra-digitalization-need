import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { requireRole } from "@/lib/auth/guard";
import { db } from "@/lib/db";
import { assessmentPeriods } from "@/lib/db/schema";
import { listDepartments } from "@/lib/queries/master";
import { PageHeader, Card, CardBody, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SubmitButton } from "@/components/ui/form";
import { PeriodForm } from "@/components/admin/forms";
import { setPeriodStatusAction } from "@/actions/admin";
import { PERIOD_STATUS_LABELS, SUBMISSION_STATUS_LABELS } from "@/lib/enums";
import { Table, THead, TH, TD } from "@/components/ui/table";
import { formatDate } from "@/lib/utils";

export const metadata = { title: "Detail Periode" };

export default async function PeriodDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireRole("admin");
  const { id } = await params;
  const period = await db.query.assessmentPeriods.findFirst({
    where: eq(assessmentPeriods.id, id),
    with: { departments: { with: { department: true } }, submissions: { with: { department: true, needs: { columns: { id: true, status: true } } } } },
  });
  if (!period) notFound();
  const depts = await listDepartments();
  const subByDept = new Map(period.submissions.map((s) => [s.departmentId, s]));
  return (
    <>
      <PageHeader
        title={period.name}
        description={`${formatDate(period.startAt)} — ${formatDate(period.dueAt, true)}`}
        actions={
          <>
            <Badge tone={period.status === "active" ? "green" : period.status === "closed" ? "gray" : "amber"}>{PERIOD_STATUS_LABELS[period.status]}</Badge>
            {period.status !== "active" && (
              <form action={setPeriodStatusAction.bind(null, period.id, "active")}>
                <SubmitButton size="sm">Aktifkan</SubmitButton>
              </form>
            )}
            {period.status === "active" && (
              <form action={setPeriodStatusAction.bind(null, period.id, "closed")}>
                <SubmitButton size="sm" variant="danger">
                  Tutup periode
                </SubmitButton>
              </form>
            )}
            <Link href="/admin/periods" className="text-sm text-primary hover:underline">
              Semua periode
            </Link>
          </>
        }
      />
      <div className="grid gap-6 lg:grid-cols-2">
        <PeriodForm period={period} departments={depts} selected={period.departments.map((d) => d.departmentId)} />
        <Card className="h-fit">
          <CardHeader title="Status respons per Bagian" description="Menutup periode menghentikan submit baru; data tetap dapat direview." />
          <CardBody className="p-0">
            <Table className="border-0">
              <THead>
                <tr>
                  <TH>Bagian</TH>
                  <TH>Profil</TH>
                  <TH>Kebutuhan</TH>
                  <TH>Submit</TH>
                </tr>
              </THead>
              <tbody>
                {period.departments.map((pd) => {
                  const s = subByDept.get(pd.departmentId);
                  const sent = s?.needs.filter((n) => n.status !== "draft" && n.status !== "archived").length ?? 0;
                  return (
                    <tr key={pd.id}>
                      <TD>{pd.department.name}</TD>
                      <TD>{s ? <Badge tone={s.status === "draft" ? "amber" : "green"}>{SUBMISSION_STATUS_LABELS[s.status]}</Badge> : <Badge>Belum mulai</Badge>}</TD>
                      <TD>{sent}</TD>
                      <TD className="text-xs text-muted">{formatDate(s?.submittedAt, true)}</TD>
                    </tr>
                  );
                })}
              </tbody>
            </Table>
          </CardBody>
        </Card>
      </div>
    </>
  );
}
