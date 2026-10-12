import Link from "next/link";
import { requireRole } from "@/lib/auth/guard";
import { listDepartments, listPeriods } from "@/lib/queries/master";
import { PageHeader, Card, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PeriodForm } from "@/components/admin/forms";
import { PERIOD_STATUS_LABELS } from "@/lib/enums";
import { formatDate } from "@/lib/utils";

export const metadata = { title: "Periode Assessment" };

export default async function PeriodsPage() {
  await requireRole("admin");
  const [periods, depts] = await Promise.all([listPeriods(), listDepartments()]);
  return (
    <>
      <PageHeader title="Periode Assessment" description="Buat periode, tetapkan tenggat dan daftar Bagian, lalu aktifkan agar responden dapat mengisi." />
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-3 lg:col-span-2">
          {periods.length === 0 && <p className="text-sm text-muted">Belum ada periode.</p>}
          {periods.map((p) => (
            <Card key={p.id}>
              <CardHeader
                title={
                  <Link href={`/admin/periods/${p.id}`} className="text-primary hover:underline">
                    {p.name}
                  </Link>
                }
                description={`${formatDate(p.startAt)} — ${formatDate(p.dueAt, true)}`}
                actions={<Badge tone={p.status === "active" ? "green" : p.status === "closed" ? "gray" : "amber"}>{PERIOD_STATUS_LABELS[p.status]}</Badge>}
              />
            </Card>
          ))}
        </div>
        <div>
          <PeriodForm departments={depts} selected={[]} />
        </div>
      </div>
    </>
  );
}
