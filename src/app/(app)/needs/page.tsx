import Link from "next/link";
import { requireRole } from "@/lib/auth/guard";
import { queryRegister } from "@/lib/queries/needs";
import { listDepartments, listPeriods } from "@/lib/queries/master";
import { getSetting } from "@/lib/settings";
import { PageHeader, EmptyState } from "@/components/ui/card";
import { Table, THead, TH, TD, Pagination } from "@/components/ui/table";
import { StatusBadge, UrgencyBadge, Badge } from "@/components/ui/badge";
import { RegisterFilterForm, filtersToQuery, parseFilters } from "@/components/needs/register-filters";
import { labelOf, SOLUTION_CATEGORY, FOLLOW_UP } from "@/lib/enums";
import { priorityCategory } from "@/lib/scoring";
import { formatDate, truncate, needCodeLabel } from "@/lib/utils";

export const metadata = { title: "Register Kebutuhan" };

export default async function NeedsRegisterPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const me = await requireRole("admin", "assessment_reviewer", "management_viewer");
  const sp = await searchParams;
  const f = parseFilters(sp);
  const thresholds = await getSetting("score_thresholds");
  const [periods, departments, { rows, total, page, pageSize }] = await Promise.all([listPeriods(), listDepartments(), queryRegister(f, thresholds)]);
  const q = filtersToQuery(f);

  return (
    <>
      <PageHeader title="Register Kebutuhan" description={`${total} kebutuhan sesuai filter. Klik kode untuk membuka detail, review, dan wawancara.`} />
      <div className="space-y-4">
        <RegisterFilterForm f={f} periods={periods} departments={departments} basePath="/needs" showExport exportQuery={q} />
        {rows.length === 0 ? (
          <EmptyState title="Tidak ada kebutuhan yang cocok" description="Ubah filter atau tunggu responden mengirimkan kebutuhan." />
        ) : (
          <Table>
            <THead>
              <tr>
                <TH>Kode</TH>
                <TH>Bagian</TH>
                <TH>Judul / masalah</TH>
                <TH>Urgensi</TH>
                <TH>Status</TH>
                <TH>Solusi awal</TH>
                <TH>Skor</TH>
                <TH>Reviewer</TH>
                <TH>Update</TH>
              </tr>
            </THead>
            <tbody>
              {rows.map((r) => {
                const cat = priorityCategory(r.weightedScore == null ? null : Number(r.weightedScore), thresholds);
                return (
                  <tr key={r.id} className="hover:bg-slate-50">
                    <TD className="font-mono text-xs whitespace-nowrap">
                      <Link href={`/needs/${r.id}`} className="text-primary hover:underline">
                        {needCodeLabel(r.needCode)}
                      </Link>
                      {r.criticalFlag && (
                        <Badge tone="red" className="ml-1">
                          Kritis
                        </Badge>
                      )}
                    </TD>
                    <TD className="whitespace-nowrap">{r.departmentName}</TD>
                    <TD className="min-w-[260px]">
                      <Link href={`/needs/${r.id}`} className="font-medium hover:underline">
                        {r.title || "(tanpa judul)"}
                      </Link>
                      <p className="text-xs text-muted">{truncate(r.problemDescription, 110)}</p>
                    </TD>
                    <TD>
                      <UrgencyBadge value={r.respondentUrgency} />
                    </TD>
                    <TD>
                      <StatusBadge status={r.status} />
                      {r.followUp === "interview" && <p className="mt-1 text-[11px] text-violet-700">{labelOf(FOLLOW_UP, r.followUp)}</p>}
                    </TD>
                    <TD className="text-xs">{r.solutionCategory ? labelOf(SOLUTION_CATEGORY, r.solutionCategory) : <span className="text-muted">-</span>}</TD>
                    <TD className="whitespace-nowrap">
                      {r.weightedScore == null ? (
                        <span className="text-muted">-</span>
                      ) : (
                        <>
                          <span className="font-semibold">{Number(r.weightedScore).toFixed(0)}</span>
                          <Badge tone={cat.tone} className="ml-1">
                            {cat.label}
                          </Badge>
                        </>
                      )}
                    </TD>
                    <TD className="text-xs whitespace-nowrap">{r.reviewerName ?? <span className="text-muted">-</span>}</TD>
                    <TD className="text-xs whitespace-nowrap text-muted">{formatDate(r.updatedAt, true)}</TD>
                  </tr>
                );
              })}
            </tbody>
          </Table>
        )}
        <Pagination page={page} pageSize={pageSize} total={total} makeHref={(p) => `/needs?${filtersToQuery(f, { page: p })}`} />
      </div>
      {me.role === "management_viewer" && <p className="mt-4 text-xs text-muted">Anda masuk sebagai Manajemen: akses baca-saja.</p>}
    </>
  );
}
