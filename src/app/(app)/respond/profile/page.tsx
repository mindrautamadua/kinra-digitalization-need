import { notFound, redirect } from "next/navigation";
import { requireRole } from "@/lib/auth/guard";
import { activePeriodsForDepartment, submissionFor } from "@/lib/queries/respond";
import { PageHeader } from "@/components/ui/card";
import { ProfileForm } from "./profile-form";

export const metadata = { title: "Profil Bagian" };

export default async function ProfilePage({ searchParams }: { searchParams: Promise<{ period?: string }> }) {
  const me = await requireRole("respondent");
  if (!me.departmentId) redirect("/respond");
  const { period: periodId } = await searchParams;
  const periods = await activePeriodsForDepartment(me.departmentId);
  const period = periods.find((p) => p.id === periodId) ?? periods[0];
  if (!period) notFound();
  const sub = await submissionFor(period.id, me.departmentId);
  return (
    <>
      <PageHeader title="Form A — Profil Bagian" description={`${me.departmentName} · Periode: ${period.name}`} />
      <ProfileForm
        periodId={period.id}
        departmentName={me.departmentName ?? ""}
        defaults={{
          respondentName: sub?.respondentName ?? me.fullName,
          respondentJobTitle: sub?.respondentJobTitle ?? me.jobTitle ?? "",
          processOwnerName: sub?.processOwnerName ?? "",
          estimatedUsersRange: sub?.estimatedUsersRange ?? "",
          mainProcesses: sub?.mainProcesses ?? "",
          mainServices: sub?.mainServices ?? "",
          currentSystems: sub?.currentSystems ?? "",
          dominantWorkMode: sub?.dominantWorkMode ?? "",
          attestation: sub?.attestation ?? false,
        }}
      />
    </>
  );
}
