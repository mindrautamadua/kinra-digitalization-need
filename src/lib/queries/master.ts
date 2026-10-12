import "server-only";
import { asc, desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { assessmentPeriods, departments } from "@/lib/db/schema";

export const listDepartments = (activeOnly = false) =>
  db.query.departments.findMany({ where: activeOnly ? eq(departments.isActive, true) : undefined, orderBy: [asc(departments.code)] });

export const listPeriods = () => db.query.assessmentPeriods.findMany({ orderBy: [desc(assessmentPeriods.startAt)] });
