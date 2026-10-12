import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { requireRole } from "@/lib/auth/guard";
import { db } from "@/lib/db";
import { interviews } from "@/lib/db/schema";
import { needOptions, staffOptions } from "@/lib/queries/interviews";
import { PageHeader } from "@/components/ui/card";
import { LinkButton } from "@/components/ui/button";
import { InterviewForm } from "@/components/needs/interview-form";
import { updateInterviewAction } from "@/actions/interviews";

export const metadata = { title: "Detail Wawancara" };

export default async function InterviewPage({ params }: { params: Promise<{ id: string }> }) {
  await requireRole("admin", "assessment_reviewer");
  const { id } = await params;
  const interview = await db.query.interviews.findFirst({ where: eq(interviews.id, id), with: { need: { columns: { id: true, needCode: true, title: true } } } });
  if (!interview) notFound();
  const [needs, staff] = await Promise.all([needOptions(), staffOptions()]);
  const needList = needs.some((n) => n.id === interview.needId) ? needs : [...needs, { id: interview.needId, needCode: interview.need.needCode, title: interview.need.title, departmentName: "" }];
  return (
    <>
      <PageHeader
        title={`Wawancara · ${interview.need.needCode}`}
        description={interview.need.title}
        actions={
          <LinkButton href={`/needs/${interview.needId}`} variant="outline" size="sm">
            Buka kebutuhan
          </LinkButton>
        }
      />
      <InterviewForm action={updateInterviewAction.bind(null, interview.id)} interview={interview} needs={needList} staff={staff} backHref="/interviews" />
    </>
  );
}
