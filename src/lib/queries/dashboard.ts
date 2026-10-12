import "server-only";
import { and, count, eq, ne, sql } from "drizzle-orm";
import type { AnyPgColumn } from "drizzle-orm/pg-core";
import { db } from "@/lib/db";
import { assessmentPeriods, departmentSubmissions, departments, digitalNeeds, needReviews, periodDepartments } from "@/lib/db/schema";
import type { ScoreThresholds } from "@/lib/scoring";

export type DashboardFilters = { periodId?: string; departmentId?: string | null };

type Row = { key: string; n: number };

export async function dashboardData(f: DashboardFilters, thresholds: ScoreThresholds) {
  const periodCond = f.periodId ? eq(departmentSubmissions.periodId, f.periodId) : undefined;
  const deptCond = f.departmentId ? eq(departmentSubmissions.departmentId, f.departmentId) : undefined;
  const base = and(ne(digitalNeeds.status, "archived"), ne(digitalNeeds.status, "draft"), periodCond, deptCond);

  // Respons Bagian
  let assigned = 0;
  let responded = 0;
  if (f.periodId) {
    const [{ n }] = await db.select({ n: count() }).from(periodDepartments).where(and(eq(periodDepartments.periodId, f.periodId), f.departmentId ? eq(periodDepartments.departmentId, f.departmentId) : undefined));
    assigned = n;
    const [{ n: r }] = await db
      .select({ n: count() })
      .from(departmentSubmissions)
      .where(and(eq(departmentSubmissions.periodId, f.periodId), ne(departmentSubmissions.status, "draft"), deptCond));
    responded = r;
  } else {
    const [{ n }] = await db.select({ n: sql<number>`count(distinct ${periodDepartments.departmentId})` }).from(periodDepartments).where(f.departmentId ? eq(periodDepartments.departmentId, f.departmentId) : undefined);
    assigned = Number(n);
    const [{ n: r }] = await db
      .select({ n: sql<number>`count(distinct ${departmentSubmissions.departmentId})` })
      .from(departmentSubmissions)
      .where(and(ne(departmentSubmissions.status, "draft"), deptCond));
    responded = Number(r);
  }

  const byStatus = await db
    .select({ key: digitalNeeds.status, n: count() })
    .from(digitalNeeds)
    .innerJoin(departmentSubmissions, eq(departmentSubmissions.id, digitalNeeds.submissionId))
    .where(base)
    .groupBy(digitalNeeds.status);

  const byDepartment = await db
    .select({ key: departments.name, n: count() })
    .from(digitalNeeds)
    .innerJoin(departmentSubmissions, eq(departmentSubmissions.id, digitalNeeds.submissionId))
    .innerJoin(departments, eq(departments.id, departmentSubmissions.departmentId))
    .where(base)
    .groupBy(departments.name)
    .orderBy(sql`count(*) desc`);

  const unnestCount = async (col: AnyPgColumn) =>
    db
      .select({ key: sql<string>`u`, n: count() })
      .from(digitalNeeds)
      .innerJoin(departmentSubmissions, eq(departmentSubmissions.id, digitalNeeds.submissionId))
      .innerJoin(sql`unnest(${col}) as u`, sql`true`)
      .where(base)
      .groupBy(sql`u`)
      .orderBy(sql`count(*) desc`);

  const byImpact = await unnestCount(digitalNeeds.impacts);
  const byDomain = await unnestCount(digitalNeeds.domainTags);

  const byUrgency = await db
    .select({ key: sql<string>`coalesce(${digitalNeeds.respondentUrgency}, 'unset')`, n: count() })
    .from(digitalNeeds)
    .innerJoin(departmentSubmissions, eq(departmentSubmissions.id, digitalNeeds.submissionId))
    .where(base)
    .groupBy(digitalNeeds.respondentUrgency);

  const s = needReviews.weightedScore;
  // Ambang di-inline (angka tervalidasi) agar ekspresi SELECT dan GROUP BY identik bagi PostgreSQL.
  const n = (x: number) => sql.raw(String(Number.isFinite(x) ? x : 0));
  const priorityExpr = sql<string>`case when ${s} is null then 'unscored' when ${s} >= ${n(thresholds.veryHigh)} then 'very_high' when ${s} >= ${n(thresholds.high)} then 'high' when ${s} >= ${n(thresholds.medium)} then 'medium' else 'low' end`;
  const byPriority = await db
    .select({ key: priorityExpr, n: count() })
    .from(digitalNeeds)
    .innerJoin(departmentSubmissions, eq(departmentSubmissions.id, digitalNeeds.submissionId))
    .leftJoin(needReviews, eq(needReviews.needId, digitalNeeds.id))
    .where(base)
    .groupBy(priorityExpr);

  const bySolution = await db
    .select({ key: sql<string>`coalesce(${needReviews.solutionCategory}, 'unset')`, n: count() })
    .from(digitalNeeds)
    .innerJoin(departmentSubmissions, eq(departmentSubmissions.id, digitalNeeds.submissionId))
    .leftJoin(needReviews, eq(needReviews.needId, digitalNeeds.id))
    .where(base)
    .groupBy(needReviews.solutionCategory)
    .orderBy(sql`count(*) desc`);

  const [{ n: needInterview }] = await db
    .select({ n: count() })
    .from(digitalNeeds)
    .innerJoin(departmentSubmissions, eq(departmentSubmissions.id, digitalNeeds.submissionId))
    .leftJoin(needReviews, eq(needReviews.needId, digitalNeeds.id))
    .where(and(base, sql`(${needReviews.followUpRecommendation} = 'interview' or ${digitalNeeds.status} in ('interview_scheduled','interview_completed'))`));

  const [{ n: critical }] = await db
    .select({ n: count() })
    .from(digitalNeeds)
    .innerJoin(departmentSubmissions, eq(departmentSubmissions.id, digitalNeeds.submissionId))
    .innerJoin(needReviews, eq(needReviews.needId, digitalNeeds.id))
    .where(and(base, eq(needReviews.criticalFlag, true)));

  const [{ n: total }] = await db.select({ n: count() }).from(digitalNeeds).innerJoin(departmentSubmissions, eq(departmentSubmissions.id, digitalNeeds.submissionId)).where(base);

  // Tren per periode (hanya bila tidak difilter per periode)
  const byPeriod = await db
    .select({ key: assessmentPeriods.name, n: count(), periodId: assessmentPeriods.id })
    .from(digitalNeeds)
    .innerJoin(departmentSubmissions, eq(departmentSubmissions.id, digitalNeeds.submissionId))
    .innerJoin(assessmentPeriods, eq(assessmentPeriods.id, departmentSubmissions.periodId))
    .where(and(ne(digitalNeeds.status, "archived"), ne(digitalNeeds.status, "draft"), deptCond))
    .groupBy(assessmentPeriods.id, assessmentPeriods.name, assessmentPeriods.startAt)
    .orderBy(assessmentPeriods.startAt);

  return {
    assigned,
    responded,
    total,
    needInterview,
    critical,
    byStatus: byStatus as Row[],
    byDepartment: byDepartment as Row[],
    byImpact: byImpact as Row[],
    byDomain: byDomain as Row[],
    byUrgency: byUrgency as Row[],
    byPriority: byPriority as Row[],
    bySolution: bySolution as Row[],
    byPeriod,
  };
}
