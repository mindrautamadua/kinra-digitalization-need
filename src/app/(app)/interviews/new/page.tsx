import { requireRole } from "@/lib/auth/guard";
import { needOptions, staffOptions } from "@/lib/queries/interviews";
import { PageHeader } from "@/components/ui/card";
import { InterviewForm } from "@/components/needs/interview-form";
import { createInterviewAction } from "@/actions/interviews";

export const metadata = { title: "Wawancara Baru" };

export default async function NewInterviewPage({ searchParams }: { searchParams: Promise<{ need?: string }> }) {
  await requireRole("admin", "assessment_reviewer");
  const { need } = await searchParams;
  const [needs, staff] = await Promise.all([needOptions(), staffOptions()]);
  const fixed = need && needs.some((n) => n.id === need) ? need : undefined;
  return (
    <>
      <PageHeader title="Wawancara baru" />
      <InterviewForm action={createInterviewAction} needs={needs} fixedNeedId={fixed} staff={staff} backHref={fixed ? `/needs/${fixed}` : "/interviews"} />
    </>
  );
}
