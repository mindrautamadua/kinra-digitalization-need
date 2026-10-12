import "server-only";
import { and, asc, count, desc, eq, ilike, inArray, ne, or, sql, type SQL } from "drizzle-orm";
import { db } from "@/lib/db";
import { assessmentPeriods, departmentSubmissions, departments, digitalNeeds, needReviews, users } from "@/lib/db/schema";
import type { ScoreThresholds } from "@/lib/scoring";

export type RegisterFilters = {
  period?: string;
  department?: string;
  status?: string;
  urgency?: string;
  impact?: string;
  solution?: string;
  interview?: string; // "yes" | "no"
  priority?: string; // very_high | high | medium | low | unscored
  critical?: string; // "1"
  q?: string;
  sort?: string; // updated | score | code | submitted
  page?: number;
  pageSize?: number;
  departmentIdRestrict?: string | null;
  includeDrafts?: boolean;
};

export function buildRegisterWhere(f: RegisterFilters, thresholds: ScoreThresholds): SQL | undefined {
  const conds: (SQL | undefined)[] = [ne(digitalNeeds.status, "archived")];
  if (!f.includeDrafts) conds.push(ne(digitalNeeds.status, "draft"));
  if (f.departmentIdRestrict) conds.push(eq(departmentSubmissions.departmentId, f.departmentIdRestrict));
  if (f.period) conds.push(eq(departmentSubmissions.periodId, f.period));
  if (f.department) conds.push(eq(departmentSubmissions.departmentId, f.department));
  if (f.status) conds.push(eq(digitalNeeds.status, f.status as (typeof digitalNeeds.status.enumValues)[number]));
  if (f.urgency) conds.push(eq(digitalNeeds.respondentUrgency, f.urgency));
  if (f.impact) conds.push(sql`${f.impact} = any(${digitalNeeds.impacts})`);
  if (f.solution) conds.push(eq(needReviews.solutionCategory, f.solution));
  if (f.critical === "1") conds.push(eq(needReviews.criticalFlag, true));
  if (f.interview === "yes")
    conds.push(or(eq(needReviews.followUpRecommendation, "interview"), inArray(digitalNeeds.status, ["interview_scheduled", "interview_completed"])));
  if (f.interview === "no")
    conds.push(
      and(
        or(sql`${needReviews.followUpRecommendation} is null`, ne(needReviews.followUpRecommendation, "interview")),
        sql`${digitalNeeds.status} not in ('interview_scheduled','interview_completed')`,
      ),
    );
  if (f.priority) {
    const s = needReviews.weightedScore;
    if (f.priority === "unscored") conds.push(sql`${s} is null`);
    if (f.priority === "very_high") conds.push(sql`${s} >= ${thresholds.veryHigh}`);
    if (f.priority === "high") conds.push(sql`${s} >= ${thresholds.high} and ${s} < ${thresholds.veryHigh}`);
    if (f.priority === "medium") conds.push(sql`${s} >= ${thresholds.medium} and ${s} < ${thresholds.high}`);
    if (f.priority === "low") conds.push(sql`${s} < ${thresholds.medium}`);
  }
  if (f.q) {
    const term = `%${f.q.trim()}%`;
    conds.push(
      or(ilike(digitalNeeds.title, term), ilike(digitalNeeds.needCode, term), ilike(digitalNeeds.problemDescription, term), ilike(digitalNeeds.businessProcess, term), ilike(departments.name, term)),
    );
  }
  return and(...conds.filter((c): c is SQL => Boolean(c)));
}

export function registerBaseQuery() {
  return db
    .select({
      id: digitalNeeds.id,
      needCode: digitalNeeds.needCode,
      title: digitalNeeds.title,
      businessProcess: digitalNeeds.businessProcess,
      problemDescription: digitalNeeds.problemDescription,
      processOwner: digitalNeeds.processOwner,
      impacts: digitalNeeds.impacts,
      respondentUrgency: digitalNeeds.respondentUrgency,
      status: digitalNeeds.status,
      submittedAt: digitalNeeds.submittedAt,
      updatedAt: digitalNeeds.updatedAt,
      departmentId: departmentSubmissions.departmentId,
      departmentName: departments.name,
      departmentCode: departments.code,
      periodId: departmentSubmissions.periodId,
      periodName: assessmentPeriods.name,
      solutionCategory: needReviews.solutionCategory,
      followUp: needReviews.followUpRecommendation,
      weightedScore: needReviews.weightedScore,
      criticalFlag: needReviews.criticalFlag,
      reviewerName: users.fullName,
      completeness: needReviews.completeness,
      strategicAlignment: needReviews.strategicAlignment,
      delayRisk: needReviews.delayRisk,
      scoreImpact: needReviews.scoreImpact,
      scoreRisk: needReviews.scoreRisk,
      scoreUrgency: needReviews.scoreUrgency,
      scoreStrategy: needReviews.scoreStrategy,
      scoreReadiness: needReviews.scoreReadiness,
      scoreReuse: needReviews.scoreReuse,
      scoreReason: needReviews.scoreReason,
      reviewerNotes: needReviews.reviewerNotes,
    })
    .from(digitalNeeds)
    .innerJoin(departmentSubmissions, eq(departmentSubmissions.id, digitalNeeds.submissionId))
    .innerJoin(departments, eq(departments.id, departmentSubmissions.departmentId))
    .innerJoin(assessmentPeriods, eq(assessmentPeriods.id, departmentSubmissions.periodId))
    .leftJoin(needReviews, eq(needReviews.needId, digitalNeeds.id))
    .leftJoin(users, eq(users.id, needReviews.reviewerId));
}

export type RegisterRow = Awaited<ReturnType<ReturnType<typeof registerBaseQuery>["execute"]>>[number];

function orderFor(sort?: string) {
  switch (sort) {
    case "score":
      return [sql`${needReviews.weightedScore} desc nulls last`, desc(digitalNeeds.updatedAt)];
    case "code":
      return [asc(digitalNeeds.needCode)];
    case "submitted":
      return [sql`${digitalNeeds.submittedAt} desc nulls last`];
    default:
      return [desc(digitalNeeds.updatedAt)];
  }
}

export async function queryRegister(f: RegisterFilters, thresholds: ScoreThresholds) {
  const where = buildRegisterWhere(f, thresholds);
  const page = Math.max(1, f.page ?? 1);
  const pageSize = Math.min(100, Math.max(5, f.pageSize ?? 25));
  const [{ total }] = await db
    .select({ total: count() })
    .from(digitalNeeds)
    .innerJoin(departmentSubmissions, eq(departmentSubmissions.id, digitalNeeds.submissionId))
    .innerJoin(departments, eq(departments.id, departmentSubmissions.departmentId))
    .leftJoin(needReviews, eq(needReviews.needId, digitalNeeds.id))
    .where(where);
  const rows = await registerBaseQuery()
    .where(where)
    .orderBy(...orderFor(f.sort))
    .limit(pageSize)
    .offset((page - 1) * pageSize);
  return { rows, total, page, pageSize };
}

/** Tanpa paginasi, untuk ekspor (dibatasi). */
export async function queryRegisterAll(f: RegisterFilters, thresholds: ScoreThresholds, limit = 5000) {
  const where = buildRegisterWhere(f, thresholds);
  return registerBaseQuery().where(where).orderBy(...orderFor(f.sort)).limit(limit);
}
