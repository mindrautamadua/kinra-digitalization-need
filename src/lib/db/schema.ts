import {
  pgTable,
  pgEnum,
  uuid,
  text,
  varchar,
  boolean,
  timestamp,
  integer,
  smallint,
  numeric,
  jsonb,
  uniqueIndex,
  index,
  type AnyPgColumn,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// ---------------------------------------------------------------------------
// Enums
// ---------------------------------------------------------------------------

export const userRoleEnum = pgEnum("user_role", [
  "admin",
  "respondent",
  "assessment_reviewer",
  "management_viewer",
]);

export const periodStatusEnum = pgEnum("period_status", ["draft", "active", "closed"]);

export const submissionStatusEnum = pgEnum("submission_status", [
  "draft",
  "submitted",
  "returned",
  "reviewed",
]);

export const needStatusEnum = pgEnum("need_status", [
  "draft",
  "submitted",
  "under_review",
  "clarification_required",
  "interview_scheduled",
  "interview_completed",
  "validated",
  "prioritized",
  "deferred",
  "rejected",
  "returned_for_revision",
  "closed",
  "archived",
]);

export const interviewStatusEnum = pgEnum("interview_status", [
  "planned",
  "scheduled",
  "completed",
  "follow_up_required",
]);

export const threadVisibilityEnum = pgEnum("thread_visibility", ["respondent", "internal"]);

// ---------------------------------------------------------------------------
// Identity
// ---------------------------------------------------------------------------

export const departments = pgTable(
  "departments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    code: varchar("code", { length: 32 }).notNull(),
    name: varchar("name", { length: 200 }).notNull(),
    description: text("description"),
    headUserId: uuid("head_user_id").references((): AnyPgColumn => users.id, {
      onDelete: "set null",
    }),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("departments_code_uq").on(t.code)],
);

export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    email: varchar("email", { length: 255 }).notNull(),
    passwordHash: text("password_hash").notNull(),
    fullName: varchar("full_name", { length: 200 }).notNull(),
    jobTitle: varchar("job_title", { length: 200 }),
    role: userRoleEnum("role").notNull().default("respondent"),
    departmentId: uuid("department_id").references(() => departments.id, {
      onDelete: "set null",
    }),
    isActive: boolean("is_active").notNull().default(true),
    mustChangePassword: boolean("must_change_password").notNull().default(false),
    failedLoginCount: integer("failed_login_count").notNull().default(0),
    lockedUntil: timestamp("locked_until", { withTimezone: true }),
    lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("users_email_uq").on(t.email), index("users_department_idx").on(t.departmentId)],
);

export const sessions = pgTable(
  "sessions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    tokenHash: varchar("token_hash", { length: 128 }).notNull(),
    userAgent: varchar("user_agent", { length: 500 }),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
  },
  (t) => [uniqueIndex("sessions_token_uq").on(t.tokenHash), index("sessions_user_idx").on(t.userId)],
);

// ---------------------------------------------------------------------------
// Assessment
// ---------------------------------------------------------------------------

export const assessmentPeriods = pgTable("assessment_periods", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 200 }).notNull(),
  description: text("description"),
  startAt: timestamp("start_at", { withTimezone: true }).notNull(),
  dueAt: timestamp("due_at", { withTimezone: true }).notNull(),
  status: periodStatusEnum("status").notNull().default("draft"),
  createdBy: uuid("created_by").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

/** Bagian yang ditetapkan ikut dalam suatu periode assessment. */
export const periodDepartments = pgTable(
  "period_departments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    periodId: uuid("period_id")
      .notNull()
      .references(() => assessmentPeriods.id, { onDelete: "cascade" }),
    departmentId: uuid("department_id")
      .notNull()
      .references(() => departments.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("period_departments_uq").on(t.periodId, t.departmentId)],
);

/** Form A — profil Bagian; satu per Bagian per periode. */
export const departmentSubmissions = pgTable(
  "department_submissions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    periodId: uuid("period_id")
      .notNull()
      .references(() => assessmentPeriods.id, { onDelete: "restrict" }),
    departmentId: uuid("department_id")
      .notNull()
      .references(() => departments.id, { onDelete: "restrict" }),
    respondentId: uuid("respondent_id").references(() => users.id, { onDelete: "set null" }),
    status: submissionStatusEnum("status").notNull().default("draft"),
    // Form A
    respondentName: varchar("respondent_name", { length: 200 }),
    respondentJobTitle: varchar("respondent_job_title", { length: 200 }),
    processOwnerName: varchar("process_owner_name", { length: 200 }),
    estimatedUsersRange: varchar("estimated_users_range", { length: 32 }),
    mainProcesses: text("main_processes"),
    mainServices: text("main_services"),
    currentSystems: text("current_systems"),
    dominantWorkMode: varchar("dominant_work_mode", { length: 32 }),
    attestation: boolean("attestation").notNull().default(false),
    submittedAt: timestamp("submitted_at", { withTimezone: true }),
    reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("department_submissions_uq").on(t.periodId, t.departmentId),
    index("department_submissions_period_idx").on(t.periodId),
  ],
);

/** Form B — satu rekaman kebutuhan digitalisasi. */
export const digitalNeeds = pgTable(
  "digital_needs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    submissionId: uuid("submission_id")
      .notNull()
      .references(() => departmentSubmissions.id, { onDelete: "restrict" }),
    /** Diberikan saat pertama kali dikirim; draft yang belum pernah dikirim tidak memakai nomor. */
    needCode: varchar("need_code", { length: 32 }),
    // Identitas dan konteks
    title: varchar("title", { length: 200 }).notNull().default(""),
    businessProcess: text("business_process"),
    processOwner: varchar("process_owner", { length: 200 }),
    affectedParties: text("affected_parties").array().notNull().default([]),
    frequency: varchar("frequency", { length: 32 }),
    estimatedVolume: varchar("estimated_volume", { length: 200 }),
    // Masalah saat ini
    problemDescription: text("problem_description"),
    currentProcess: text("current_process"),
    impacts: text("impacts").array().notNull().default([]),
    problemFrequency: varchar("problem_frequency", { length: 32 }),
    consequenceIfUnresolved: text("consequence_if_unresolved"),
    evidenceAvailable: varchar("evidence_available", { length: 32 }),
    // Kebutuhan dan solusi
    desiredOutcome: text("desired_outcome"),
    proposedSolution: text("proposed_solution").array().notNull().default([]),
    existingSystemRelation: varchar("existing_system_relation", { length: 16 }),
    existingSystemDetail: text("existing_system_detail"),
    dataRequired: text("data_required"),
    integrationRequired: varchar("integration_required", { length: 16 }),
    integrationDetail: text("integration_detail"),
    sensitiveDataFlag: varchar("sensitive_data_flag", { length: 16 }),
    sensitiveDataDetail: text("sensitive_data_detail"),
    mobileFieldNeed: varchar("mobile_field_need", { length: 16 }),
    domainTags: text("domain_tags").array().notNull().default([]),
    // Manfaat, urgensi, kesiapan
    expectedBenefits: text("expected_benefits").array().notNull().default([]),
    // Ukuran keberhasilan terstruktur; `baseline` = keterangan bebas, `target` = isian teks lama (sebelum terstruktur).
    metricName: varchar("metric_name", { length: 200 }),
    metricUnit: varchar("metric_unit", { length: 64 }),
    baselineValue: numeric("baseline_value", { mode: "number" }),
    targetValue: numeric("target_value", { mode: "number" }),
    baseline: text("baseline"),
    target: text("target"),
    respondentUrgency: varchar("respondent_urgency", { length: 16 }),
    urgencyReason: text("urgency_reason"),
    externalDeadline: text("external_deadline"),
    dataReadiness: varchar("data_readiness", { length: 16 }),
    processReadiness: varchar("process_readiness", { length: 16 }),
    ownerReadiness: varchar("owner_readiness", { length: 32 }),
    dependencies: text("dependencies"),
    estimatedCost: text("estimated_cost"),
    additionalNotes: text("additional_notes"),
    // Workflow
    status: needStatusEnum("status").notNull().default("draft"),
    statusReason: text("status_reason"),
    submittedAt: timestamp("submitted_at", { withTimezone: true }),
    lastSubmittedAt: timestamp("last_submitted_at", { withTimezone: true }),
    archivedAt: timestamp("archived_at", { withTimezone: true }),
    archiveReason: text("archive_reason"),
    createdBy: uuid("created_by").references(() => users.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("digital_needs_code_uq").on(t.needCode),
    index("digital_needs_submission_idx").on(t.submissionId),
    index("digital_needs_status_idx").on(t.status),
    index("digital_needs_urgency_idx").on(t.respondentUrgency),
  ],
);

export const needAttachments = pgTable(
  "need_attachments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    needId: uuid("need_id")
      .notNull()
      .references(() => digitalNeeds.id, { onDelete: "restrict" }),
    storageKey: varchar("storage_key", { length: 255 }).notNull(),
    originalFilename: varchar("original_filename", { length: 255 }).notNull(),
    mimeType: varchar("mime_type", { length: 128 }).notNull(),
    sizeBytes: integer("size_bytes").notNull(),
    uploadedBy: uuid("uploaded_by").references(() => users.id, { onDelete: "set null" }),
    archivedAt: timestamp("archived_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("need_attachments_need_idx").on(t.needId)],
);

/** Form C — review Tim Assessment TI; satu baris per kebutuhan (riwayat di audit_logs). */
export const needReviews = pgTable(
  "need_reviews",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    needId: uuid("need_id")
      .notNull()
      .references(() => digitalNeeds.id, { onDelete: "restrict" }),
    reviewerId: uuid("reviewer_id").references(() => users.id, { onDelete: "set null" }),
    completeness: varchar("completeness", { length: 32 }),
    rootCauseStatus: varchar("root_cause_status", { length: 16 }),
    duplicateStatus: varchar("duplicate_status", { length: 16 }),
    relatedNeedIds: uuid("related_need_ids").array().notNull().default([]),
    solutionCategory: varchar("solution_category", { length: 32 }),
    strategicAlignment: varchar("strategic_alignment", { length: 16 }),
    delayRisk: varchar("delay_risk", { length: 16 }),
    delayRiskReason: text("delay_risk_reason"),
    followUpRecommendation: varchar("follow_up_recommendation", { length: 32 }),
    reviewerNotes: text("reviewer_notes"),
    clarificationQuestions: text("clarification_questions"),
    // Skor 1..5 per kriteria (kriteria tetap, kolom terpisah)
    scoreImpact: smallint("score_impact"),
    scoreRisk: smallint("score_risk"),
    scoreUrgency: smallint("score_urgency"),
    scoreStrategy: smallint("score_strategy"),
    scoreReadiness: smallint("score_readiness"),
    scoreReuse: smallint("score_reuse"),
    scoreReason: text("score_reason"),
    weightedScore: numeric("weighted_score", { precision: 5, scale: 2 }),
    criticalFlag: boolean("critical_flag").notNull().default(false),
    criticalReason: text("critical_reason"),
    reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("need_reviews_need_uq").on(t.needId)],
);

export const clarificationThreads = pgTable(
  "clarification_threads",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    needId: uuid("need_id")
      .notNull()
      .references(() => digitalNeeds.id, { onDelete: "restrict" }),
    authorId: uuid("author_id").references(() => users.id, { onDelete: "set null" }),
    message: text("message").notNull(),
    visibility: threadVisibilityEnum("visibility").notNull().default("respondent"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("clarification_threads_need_idx").on(t.needId)],
);

/** Form D — interview tracker. */
export const interviews = pgTable(
  "interviews",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    needId: uuid("need_id")
      .notNull()
      .references(() => digitalNeeds.id, { onDelete: "restrict" }),
    objective: text("objective"),
    scheduledAt: timestamp("scheduled_at", { withTimezone: true }),
    participants: text("participants"),
    questions: text("questions"),
    findings: text("findings"),
    currentVsTarget: text("current_vs_target"),
    verifiedBaseline: text("verified_baseline"),
    dependenciesRisks: text("dependencies_risks"),
    outcome: text("outcome"),
    ownerUserId: uuid("owner_user_id").references(() => users.id, { onDelete: "set null" }),
    dueAt: timestamp("due_at", { withTimezone: true }),
    status: interviewStatusEnum("status").notNull().default("planned"),
    sharedWithRespondent: boolean("shared_with_respondent").notNull().default(false),
    notes: text("notes"),
    createdBy: uuid("created_by").references(() => users.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("interviews_need_idx").on(t.needId)],
);

// ---------------------------------------------------------------------------
// Platform
// ---------------------------------------------------------------------------

export const auditLogs = pgTable(
  "audit_logs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    actorUserId: uuid("actor_user_id").references(() => users.id, { onDelete: "set null" }),
    action: varchar("action", { length: 64 }).notNull(),
    entityType: varchar("entity_type", { length: 64 }).notNull(),
    entityId: varchar("entity_id", { length: 64 }),
    beforeJson: jsonb("before_json"),
    afterJson: jsonb("after_json"),
    metadata: jsonb("metadata"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("audit_logs_entity_idx").on(t.entityType, t.entityId),
    index("audit_logs_created_idx").on(t.createdAt),
  ],
);

export const notifications = pgTable(
  "notifications",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    title: varchar("title", { length: 200 }).notNull(),
    body: text("body"),
    link: varchar("link", { length: 500 }),
    readAt: timestamp("read_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("notifications_user_idx").on(t.userId, t.readAt)],
);

export const appSettings = pgTable("app_settings", {
  key: varchar("key", { length: 64 }).primaryKey(),
  valueJson: jsonb("value_json").notNull(),
  updatedBy: uuid("updated_by").references(() => users.id, { onDelete: "set null" }),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// ---------------------------------------------------------------------------
// Relations
// ---------------------------------------------------------------------------

export const usersRelations = relations(users, ({ one }) => ({
  department: one(departments, { fields: [users.departmentId], references: [departments.id] }),
}));

export const departmentsRelations = relations(departments, ({ one, many }) => ({
  head: one(users, { fields: [departments.headUserId], references: [users.id] }),
  submissions: many(departmentSubmissions),
}));

export const assessmentPeriodsRelations = relations(assessmentPeriods, ({ many }) => ({
  departments: many(periodDepartments),
  submissions: many(departmentSubmissions),
}));

export const periodDepartmentsRelations = relations(periodDepartments, ({ one }) => ({
  period: one(assessmentPeriods, { fields: [periodDepartments.periodId], references: [assessmentPeriods.id] }),
  department: one(departments, { fields: [periodDepartments.departmentId], references: [departments.id] }),
}));

export const departmentSubmissionsRelations = relations(departmentSubmissions, ({ one, many }) => ({
  period: one(assessmentPeriods, { fields: [departmentSubmissions.periodId], references: [assessmentPeriods.id] }),
  department: one(departments, { fields: [departmentSubmissions.departmentId], references: [departments.id] }),
  respondent: one(users, { fields: [departmentSubmissions.respondentId], references: [users.id] }),
  needs: many(digitalNeeds),
}));

export const digitalNeedsRelations = relations(digitalNeeds, ({ one, many }) => ({
  submission: one(departmentSubmissions, { fields: [digitalNeeds.submissionId], references: [departmentSubmissions.id] }),
  review: one(needReviews, { fields: [digitalNeeds.id], references: [needReviews.needId] }),
  attachments: many(needAttachments),
  threads: many(clarificationThreads),
  interviews: many(interviews),
}));

export const needReviewsRelations = relations(needReviews, ({ one }) => ({
  need: one(digitalNeeds, { fields: [needReviews.needId], references: [digitalNeeds.id] }),
  reviewer: one(users, { fields: [needReviews.reviewerId], references: [users.id] }),
}));

export const needAttachmentsRelations = relations(needAttachments, ({ one }) => ({
  need: one(digitalNeeds, { fields: [needAttachments.needId], references: [digitalNeeds.id] }),
  uploader: one(users, { fields: [needAttachments.uploadedBy], references: [users.id] }),
}));

export const clarificationThreadsRelations = relations(clarificationThreads, ({ one }) => ({
  need: one(digitalNeeds, { fields: [clarificationThreads.needId], references: [digitalNeeds.id] }),
  author: one(users, { fields: [clarificationThreads.authorId], references: [users.id] }),
}));

export const interviewsRelations = relations(interviews, ({ one }) => ({
  need: one(digitalNeeds, { fields: [interviews.needId], references: [digitalNeeds.id] }),
  owner: one(users, { fields: [interviews.ownerUserId], references: [users.id] }),
}));

export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
  actor: one(users, { fields: [auditLogs.actorUserId], references: [users.id] }),
}));

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type User = typeof users.$inferSelect;
export type Department = typeof departments.$inferSelect;
export type AssessmentPeriod = typeof assessmentPeriods.$inferSelect;
export type DepartmentSubmission = typeof departmentSubmissions.$inferSelect;
export type DigitalNeed = typeof digitalNeeds.$inferSelect;
export type NeedReview = typeof needReviews.$inferSelect;
export type NeedAttachment = typeof needAttachments.$inferSelect;
export type ClarificationThread = typeof clarificationThreads.$inferSelect;
export type Interview = typeof interviews.$inferSelect;
export type AuditLog = typeof auditLogs.$inferSelect;
export type Notification = typeof notifications.$inferSelect;

export type UserRole = (typeof userRoleEnum.enumValues)[number];
export type NeedStatus = (typeof needStatusEnum.enumValues)[number];
export type PeriodStatus = (typeof periodStatusEnum.enumValues)[number];
export type InterviewStatus = (typeof interviewStatusEnum.enumValues)[number];
