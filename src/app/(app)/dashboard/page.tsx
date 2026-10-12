import Link from "next/link";
import { requireRole } from "@/lib/auth/guard";
import { dashboardData } from "@/lib/queries/dashboard";
import { listDepartments, listPeriods } from "@/lib/queries/master";
import { getSetting } from "@/lib/settings";
import { PageHeader, Stat, Card, CardBody, CardHeader } from "@/components/ui/card";
import { BarList } from "@/components/ui/bars";
import { Select } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { BENEFITS, IMPACTS, NEED_STATUS_LABELS, SOLUTION_CATEGORY, URGENCY, labelOf } from "@/lib/enums";
import { pct } from "@/lib/utils";
import { formatDate } from "@/lib/utils";

export const metadata = { title: "Dashboard" };

const PRIORITY_LABEL: Record<string, string> = { very_high: "Sangat tinggi (≥80)", high: "Tinggi (65–79)", medium: "Menengah (50–64)", low: "Rendah (<50)", unscored: "Belum dinilai" };
const PRIORITY_ORDER = ["very_high", "high", "medium", "low", "unscored"];
const URGENCY_ORDER = ["critical", "high", "medium", "low", "unset"];

export default async function DashboardPage({ searchParams }: { searchParams: Promise<{ period?: string; department?: string }> }) {
  const me = await requireRole("admin", "assessment_reviewer", "management_viewer");
  const sp = await searchParams;
  const [periods, departments, thresholds] = await Promise.all([listPeriods(), listDepartments(), getSetting("score_thresholds")]);
  const activePeriod = periods.find((p) => p.status === "active");
  const periodId = sp.period === "all" ? undefined : (periods.find((p) => p.id === sp.period)?.id ?? activePeriod?.id ?? periods[0]?.id);
  const departmentId = departments.find((d) => d.id === sp.department)?.id ?? null;
  const d = await dashboardData({ periodId, departmentId }, thresholds);
  const period = periods.find((p) => p.id === periodId);
  const q = (extra: Record<string, string>) => {
    const p = new URLSearchParams();
    if (periodId) p.set("period", periodId);
    if (departmentId) p.set("department", departmentId);
    for (const [k, v] of Object.entries(extra)) p.set(k, v);
    return `/needs?${p.toString()}`;
  };

  return (
    <>
      <PageHeader
        title="Dashboard Assessment"
        description={period ? `${period.name} · tenggat ${formatDate(period.dueAt)} · ${period.status === "active" ? "aktif" : period.status}` : "Seluruh periode"}
        actions={
          <form method="get" className="flex flex-wrap items-center gap-2">
            <Select name="period" defaultValue={periodId ?? "all"} className="h-9 text-xs" aria-label="Periode">
              <option value="all">Semua periode</option>
              {periods.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </Select>
            <Select name="department" defaultValue={departmentId ?? ""} className="h-9 text-xs" aria-label="Bagian">
              <option value="">Semua Bagian</option>
              {departments.map((x) => (
                <option key={x.id} value={x.id}>
                  {x.name}
                </option>
              ))}
            </Select>
            <Button type="submit" size="sm" variant="outline">
              Terapkan
            </Button>
          </form>
        }
      />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        <Stat label="Bagian ditetapkan" value={d.assigned} />
        <Stat label="Sudah mengisi" value={d.responded} sub={`${d.assigned - d.responded} belum mengisi`} tone="success" />
        <Stat label="Tingkat respons" value={`${pct(d.responded, d.assigned)}%`} sub="target ≥ 90%" tone={pct(d.responded, d.assigned) >= 90 ? "success" : "warning"} />
        <Stat label="Total kebutuhan" value={d.total} sub="tidak termasuk draft" />
        <Stat label="Perlu wawancara" value={<Link href={q({ interview: "yes" })} className="hover:underline">{d.needInterview}</Link>} />
        <Stat label="Risiko kritis" value={<Link href={q({ critical: "1" })} className="hover:underline">{d.critical}</Link>} tone={d.critical > 0 ? "danger" : "default"} />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
        <Card>
          <CardHeader title="Kebutuhan menurut status" />
          <CardBody>
            <ul className="divide-y divide-border text-sm">
              {Object.keys(NEED_STATUS_LABELS)
                .filter((k) => k !== "draft" && k !== "archived")
                .map((k) => {
                  const n = Number(d.byStatus.find((r) => r.key === k)?.n ?? 0);
                  return (
                    <li key={k} className="flex items-center justify-between py-1.5">
                      <Link href={q({ status: k })} className="hover:underline">
                        {NEED_STATUS_LABELS[k]}
                      </Link>
                      <span className="tabular-nums font-medium">{n}</span>
                    </li>
                  );
                })}
            </ul>
          </CardBody>
        </Card>
        <BarList title="Kebutuhan per Bagian" rows={d.byDepartment} max={15} />
        <Card>
          <CardHeader title="Urgensi responden vs prioritas reviewer" description="Urgensi dilaporkan Bagian dibandingkan hasil skor setelah validasi." />
          <CardBody className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="mb-2 text-xs font-semibold uppercase text-muted">Urgensi responden</p>
              <ul className="space-y-1">
                {URGENCY_ORDER.map((k) => (
                  <li key={k} className="flex justify-between">
                    <span>{k === "unset" ? "Belum diisi" : labelOf(URGENCY, k)}</span>
                    <span className="tabular-nums font-medium">{Number(d.byUrgency.find((r) => r.key === k)?.n ?? 0)}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="mb-2 text-xs font-semibold uppercase text-muted">Prioritas reviewer</p>
              <ul className="space-y-1">
                {PRIORITY_ORDER.map((k) => (
                  <li key={k} className="flex justify-between">
                    <Link href={q({ priority: k })} className="hover:underline">
                      {PRIORITY_LABEL[k]}
                    </Link>
                    <span className="tabular-nums font-medium">{Number(d.byPriority.find((r) => r.key === k)?.n ?? 0)}</span>
                  </li>
                ))}
              </ul>
            </div>
          </CardBody>
        </Card>
        <BarList title="Distribusi kategori dampak" rows={d.byImpact} labelOf={(k) => labelOf(IMPACTS, k)} />
        <BarList title="Distribusi manfaat yang diharapkan" rows={d.byBenefit} labelOf={(k) => labelOf(BENEFITS, k)} />
        <BarList title="Kebutuhan per kategori solusi awal" rows={d.bySolution} labelOf={(k) => (k === "unset" ? "Belum dikategorikan" : labelOf(SOLUTION_CATEGORY, k))} />
        {d.byPeriod.length > 1 && <BarList title="Tren respons menurut periode" rows={d.byPeriod} />}
      </div>
      {me.role === "management_viewer" && <p className="mt-6 text-xs text-muted">Skor dan kategori adalah indikasi awal; status Prioritized tidak berarti anggaran disetujui.</p>}
    </>
  );
}
