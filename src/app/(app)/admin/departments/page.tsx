import { requireRole } from "@/lib/auth/guard";
import { listDepartments } from "@/lib/queries/master";
import { PageHeader, Card, CardBody, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DepartmentForm } from "@/components/admin/forms";

export const metadata = { title: "Master Bagian" };

export default async function DepartmentsPage() {
  await requireRole("admin");
  const depts = await listDepartments();
  return (
    <>
      <PageHeader title="Master Bagian" description={`${depts.length} Bagian terdaftar. Bagian nonaktif tidak muncul saat menyusun periode baru.`} />
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-3 lg:col-span-2">
          {depts.map((d) => (
            <Card key={d.id}>
              <CardHeader
                title={
                  <span>
                    <span className="mr-2 font-mono text-xs text-muted">{d.code}</span>
                    {d.name}
                  </span>
                }
                actions={<Badge tone={d.isActive ? "green" : "gray"}>{d.isActive ? "Aktif" : "Nonaktif"}</Badge>}
              />
              <CardBody>
                <details>
                  <summary className="cursor-pointer text-sm text-primary">Edit</summary>
                  <div className="mt-3">
                    <DepartmentForm dept={d} />
                  </div>
                </details>
              </CardBody>
            </Card>
          ))}
        </div>
        <Card className="h-fit">
          <CardHeader title="Tambah Bagian" />
          <CardBody>
            <DepartmentForm />
          </CardBody>
        </Card>
      </div>
    </>
  );
}
