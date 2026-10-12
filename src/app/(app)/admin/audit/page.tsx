import { and, count, desc, eq, ilike, or, type SQL } from "drizzle-orm";
import { requireRole } from "@/lib/auth/guard";
import { db } from "@/lib/db";
import { auditLogs, users } from "@/lib/db/schema";
import { PageHeader } from "@/components/ui/card";
import { Input, Select } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, THead, TH, TD, Pagination } from "@/components/ui/table";
import { formatDate } from "@/lib/utils";

export const metadata = { title: "Audit Trail" };

const PAGE = 50;

export default async function AuditPage({ searchParams }: { searchParams: Promise<{ q?: string; entity?: string; page?: string }> }) {
  await requireRole("admin");
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page ?? 1) || 1);
  const conds: SQL[] = [];
  if (sp.entity) conds.push(eq(auditLogs.entityType, sp.entity));
  if (sp.q) conds.push(or(ilike(auditLogs.action, `%${sp.q}%`), ilike(auditLogs.entityId, `%${sp.q}%`), ilike(users.fullName, `%${sp.q}%`))!);
  const where = conds.length ? and(...conds) : undefined;
  const [{ total }] = await db.select({ total: count() }).from(auditLogs).leftJoin(users, eq(users.id, auditLogs.actorUserId)).where(where);
  const rows = await db
    .select({ log: auditLogs, actor: users.fullName })
    .from(auditLogs)
    .leftJoin(users, eq(users.id, auditLogs.actorUserId))
    .where(where)
    .orderBy(desc(auditLogs.createdAt))
    .limit(PAGE)
    .offset((page - 1) * PAGE);
  const entities = ["digital_need", "need_review", "interview", "need_attachment", "needs_register", "user", "department", "assessment_period", "department_submission", "app_settings"];
  const qs = (p: number) => {
    const u = new URLSearchParams();
    if (sp.q) u.set("q", sp.q);
    if (sp.entity) u.set("entity", sp.entity);
    if (p > 1) u.set("page", String(p));
    return `/admin/audit?${u.toString()}`;
  };
  return (
    <>
      <PageHeader title="Audit Trail" description="Catatan aktivitas penting. Tidak dapat diedit melalui aplikasi." />
      <form method="get" className="mb-4 flex flex-wrap gap-2">
        <Input name="q" defaultValue={sp.q ?? ""} placeholder="Cari aksi / ID / aktor…" className="h-9 max-w-xs text-xs" />
        <Select name="entity" defaultValue={sp.entity ?? ""} className="h-9 w-auto text-xs">
          <option value="">Semua entitas</option>
          {entities.map((e) => (
            <option key={e} value={e}>
              {e}
            </option>
          ))}
        </Select>
        <Button type="submit" size="sm" variant="outline">
          Filter
        </Button>
      </form>
      <Table>
        <THead>
          <tr>
            <TH>Waktu</TH>
            <TH>Aktor</TH>
            <TH>Aksi</TH>
            <TH>Entitas</TH>
            <TH>Detail</TH>
          </tr>
        </THead>
        <tbody>
          {rows.map(({ log, actor }) => (
            <tr key={log.id}>
              <TD className="whitespace-nowrap text-xs">{formatDate(log.createdAt, true)}</TD>
              <TD className="whitespace-nowrap text-xs">{actor ?? <span className="text-muted">sistem / anonim</span>}</TD>
              <TD className="font-mono text-xs">{log.action}</TD>
              <TD className="text-xs">
                {log.entityType}
                {log.entityId && <span className="block font-mono text-[10px] text-muted">{log.entityId}</span>}
              </TD>
              <TD className="max-w-[420px]">
                <details>
                  <summary className="cursor-pointer text-xs text-primary">lihat</summary>
                  <pre className="mt-1 max-h-64 overflow-auto rounded bg-slate-50 p-2 text-[11px]">{JSON.stringify({ before: log.beforeJson, after: log.afterJson, metadata: log.metadata }, null, 1)}</pre>
                </details>
              </TD>
            </tr>
          ))}
        </tbody>
      </Table>
      <Pagination page={page} pageSize={PAGE} total={total} makeHref={qs} />
    </>
  );
}
