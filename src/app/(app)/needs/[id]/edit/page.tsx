import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth/guard";
import { loadNeedFor } from "@/lib/queries/respond";
import { PageHeader } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/badge";
import { NeedForm } from "@/components/needs/need-form";
import { staffEditNeedAction } from "@/actions/review";
import { FormMessage } from "@/components/ui/form";

export const metadata = { title: "Koreksi Administratif" };

export default async function StaffEditNeedPage({ params }: { params: Promise<{ id: string }> }) {
  const me = await requireRole("admin", "assessment_reviewer");
  const { id } = await params;
  const need = await loadNeedFor(me, id);
  if (!need) notFound();
  const { submission, review, attachments, threads, interviews, ...plain } = need;
  void review; void attachments; void threads; void interviews;
  return (
    <>
      <PageHeader
        title={`Koreksi administratif · ${need.needCode}`}
        description={`${submission.department.name} · Perubahan oleh staf dicatat di audit trail beserta nilai sebelum/sesudah.`}
        actions={<StatusBadge status={need.status} />}
      />
      <div className="mb-4">
        <FormMessage tone="info" message="Gunakan hanya untuk koreksi administratif (mis. salah ketik, penyesuaian kategori). Perubahan substantif sebaiknya dikembalikan ke responden." />
      </div>
      <NeedForm need={plain} staffAction={staffEditNeedAction.bind(null, need.id)} backHref={`/needs/${need.id}`} />
    </>
  );
}
