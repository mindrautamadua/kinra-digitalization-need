import { requireRole } from "@/lib/auth/guard";
import { getAllSettings } from "@/lib/settings";
import { PageHeader } from "@/components/ui/card";
import { SettingsForm } from "@/components/admin/forms";

export const metadata = { title: "Pengaturan" };

export default async function SettingsPage() {
  await requireRole("admin");
  const s = await getAllSettings();
  return (
    <>
      <PageHeader title="Pengaturan Assessment" description="Parameter skor dan hak akses tambahan. Perubahan tercatat di audit trail." />
      <SettingsForm weights={s.score_weights} thresholds={s.score_thresholds} allowRespondentExport={s.allow_respondent_export} mgmtDetails={s.management_can_view_details} />
    </>
  );
}
