import "server-only";
import { and, asc, desc, eq, inArray, ne } from "drizzle-orm";
import { db } from "@/lib/db";
import { departmentSubmissions, departments, digitalNeeds, users } from "@/lib/db/schema";

export async function needOptions() {
  return db
    .select({ id: digitalNeeds.id, needCode: digitalNeeds.needCode, title: digitalNeeds.title, departmentName: departments.name })
    .from(digitalNeeds)
    .innerJoin(departmentSubmissions, eq(departmentSubmissions.id, digitalNeeds.submissionId))
    .innerJoin(departments, eq(departments.id, departmentSubmissions.departmentId))
    .where(and(ne(digitalNeeds.status, "draft"), ne(digitalNeeds.status, "archived")))
    .orderBy(asc(digitalNeeds.needCode));
}

export async function staffOptions() {
  return db
    .select({ id: users.id, fullName: users.fullName })
    .from(users)
    .where(and(eq(users.isActive, true), inArray(users.role, ["admin", "assessment_reviewer"])))
    .orderBy(asc(users.fullName));
}

export async function listInterviews(status?: string) {
  return db.query.interviews.findMany({
    where: status ? (t, { eq }) => eq(t.status, status as "planned") : undefined,
    orderBy: (t) => [desc(t.scheduledAt), desc(t.createdAt)],
    with: {
      need: { columns: { id: true, needCode: true, title: true }, with: { submission: { columns: {}, with: { department: { columns: { name: true } } } } } },
      owner: { columns: { fullName: true } },
    },
  });
}
