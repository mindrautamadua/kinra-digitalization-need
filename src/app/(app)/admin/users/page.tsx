import { asc } from "drizzle-orm";
import { requireRole } from "@/lib/auth/guard";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { listDepartments } from "@/lib/queries/master";
import { PageHeader, Card, CardBody, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DeleteUserForm, UserForm } from "@/components/admin/forms";
import { ROLE_LABELS } from "@/lib/enums";
import { formatDate } from "@/lib/utils";

export const metadata = { title: "Pengguna" };

export default async function UsersPage() {
  const me = await requireRole("admin");
  const [rows, depts] = await Promise.all([db.query.users.findMany({ orderBy: [asc(users.role), asc(users.fullName)], with: { department: true } }), listDepartments()]);
  return (
    <>
      <PageHeader title="Pengguna dan Role" description={`${rows.length} akun. Kata sandi tidak pernah ditampilkan; reset akan memaksa penggantian saat login berikutnya.`} />
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-3 lg:col-span-2">
          {rows.map((u) => (
            <Card key={u.id}>
              <CardHeader
                title={u.fullName}
                description={
                  <>
                    {u.email} · {ROLE_LABELS[u.role]}
                    {u.department ? ` · ${u.department.name}` : ""} · login terakhir {formatDate(u.lastLoginAt, true)}
                  </>
                }
                actions={
                  <>
                    {u.mustChangePassword && <Badge tone="amber">Wajib ganti sandi</Badge>}
                    {u.lockedUntil && u.lockedUntil > new Date() && <Badge tone="red">Terkunci</Badge>}
                    <Badge tone={u.isActive ? "green" : "gray"}>{u.isActive ? "Aktif" : "Nonaktif"}</Badge>
                  </>
                }
              />
              <CardBody>
                <details>
                  <summary className="cursor-pointer text-sm text-primary">Edit</summary>
                  <div className="mt-3">
                    <UserForm user={u} departments={depts} />
                  </div>
                  {u.id !== me.id && (
                    <div className="mt-4 border-t border-border pt-3">
                      <DeleteUserForm user={u} />
                    </div>
                  )}
                </details>
              </CardBody>
            </Card>
          ))}
        </div>
        <Card className="h-fit">
          <CardHeader title="Tambah pengguna" />
          <CardBody>
            <UserForm departments={depts} />
          </CardBody>
        </Card>
      </div>
    </>
  );
}
