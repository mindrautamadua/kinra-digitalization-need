import "server-only";
import { and, desc, eq, ne } from "drizzle-orm";
import { db } from "@/lib/db";
import { assessmentPeriods, departmentSubmissions, digitalNeeds, periodDepartments } from "@/lib/db/schema";
import type { SessionUser } from "@/lib/auth/session";

/** Periode aktif yang mencakup Bagian pengguna. */
export async function activePeriodsForDepartment(departmentId: string) {
  return db
    .select({ period: assessmentPeriods })
    .from(assessmentPeriods)
    .innerJoin(periodDepartments, eq(periodDepartments.periodId, assessmentPeriods.id))
    .where(and(eq(periodDepartments.departmentId, departmentId), eq(assessmentPeriods.status, "active")))
    .orderBy(desc(assessmentPeriods.dueAt))
    .then((rows) => rows.map((r) => r.period));
}

export async function submissionFor(periodId: string, departmentId: string) {
  return db.query.departmentSubmissions.findFirst({
    where: and(eq(departmentSubmissions.periodId, periodId), eq(departmentSubmissions.departmentId, departmentId)),
    with: { period: true, department: true },
  });
}

export async function needsForSubmission(submissionId: string) {
  return db.query.digitalNeeds.findMany({
    where: and(eq(digitalNeeds.submissionId, submissionId), ne(digitalNeeds.status, "archived")),
    orderBy: [desc(digitalNeeds.createdAt)],
    with: { review: { columns: { weightedScore: true, criticalFlag: true } } },
  });
}

/** Memuat kebutuhan beserta konteks dan memastikan pengguna berhak melihat. Null bila tidak berhak. */
export async function loadNeedFor(user: SessionUser, needId: string) {
  const need = await db.query.digitalNeeds.findFirst({
    where: eq(digitalNeeds.id, needId),
    with: {
      submission: { with: { period: true, department: true, respondent: { columns: { id: true, fullName: true, email: true } } } },
      review: { with: { reviewer: { columns: { id: true, fullName: true } } } },
      attachments: { with: { uploader: { columns: { fullName: true } } } },
      threads: { with: { author: { columns: { id: true, fullName: true, role: true } } }, orderBy: (t, { asc }) => [asc(t.createdAt)] },
      interviews: { with: { owner: { columns: { fullName: true } } }, orderBy: (t, { desc }) => [desc(t.createdAt)] },
    },
  });
  if (!need) return null;
  if (user.role === "respondent") {
    if (!user.departmentId || need.submission.departmentId !== user.departmentId) return null;
  }
  return need;
}

export type NeedWithContext = NonNullable<Awaited<ReturnType<typeof loadNeedFor>>>;

/** Status yang masih dapat diedit oleh responden. */
export const RESPONDENT_EDITABLE = new Set(["draft", "returned_for_revision", "clarification_required"]);
