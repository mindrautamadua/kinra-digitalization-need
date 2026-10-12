CREATE TYPE "public"."interview_status" AS ENUM('planned', 'scheduled', 'completed', 'follow_up_required');--> statement-breakpoint
CREATE TYPE "public"."need_status" AS ENUM('draft', 'submitted', 'under_review', 'clarification_required', 'interview_scheduled', 'interview_completed', 'validated', 'prioritized', 'deferred', 'rejected', 'returned_for_revision', 'closed', 'archived');--> statement-breakpoint
CREATE TYPE "public"."period_status" AS ENUM('draft', 'active', 'closed');--> statement-breakpoint
CREATE TYPE "public"."submission_status" AS ENUM('draft', 'submitted', 'returned', 'reviewed');--> statement-breakpoint
CREATE TYPE "public"."thread_visibility" AS ENUM('respondent', 'internal');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('admin', 'respondent', 'assessment_reviewer', 'management_viewer');--> statement-breakpoint
CREATE TABLE "app_settings" (
	"key" varchar(64) PRIMARY KEY NOT NULL,
	"value_json" jsonb NOT NULL,
	"updated_by" uuid,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "assessment_periods" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(200) NOT NULL,
	"description" text,
	"start_at" timestamp with time zone NOT NULL,
	"due_at" timestamp with time zone NOT NULL,
	"status" "period_status" DEFAULT 'draft' NOT NULL,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"actor_user_id" uuid,
	"action" varchar(64) NOT NULL,
	"entity_type" varchar(64) NOT NULL,
	"entity_id" varchar(64),
	"before_json" jsonb,
	"after_json" jsonb,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "clarification_threads" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"need_id" uuid NOT NULL,
	"author_id" uuid,
	"message" text NOT NULL,
	"visibility" "thread_visibility" DEFAULT 'respondent' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "department_submissions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"period_id" uuid NOT NULL,
	"department_id" uuid NOT NULL,
	"respondent_id" uuid,
	"status" "submission_status" DEFAULT 'draft' NOT NULL,
	"respondent_name" varchar(200),
	"respondent_job_title" varchar(200),
	"process_owner_name" varchar(200),
	"estimated_users_range" varchar(32),
	"main_processes" text,
	"main_services" text,
	"current_systems" text,
	"dominant_work_mode" varchar(32),
	"attestation" boolean DEFAULT false NOT NULL,
	"submitted_at" timestamp with time zone,
	"reviewed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "departments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" varchar(32) NOT NULL,
	"name" varchar(200) NOT NULL,
	"description" text,
	"head_user_id" uuid,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "digital_needs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"submission_id" uuid NOT NULL,
	"need_code" varchar(32) NOT NULL,
	"title" varchar(200) DEFAULT '' NOT NULL,
	"business_process" text,
	"process_owner" varchar(200),
	"affected_parties" text[] DEFAULT '{}' NOT NULL,
	"frequency" varchar(32),
	"estimated_volume" varchar(200),
	"problem_description" text,
	"current_process" text,
	"impacts" text[] DEFAULT '{}' NOT NULL,
	"problem_frequency" varchar(32),
	"consequence_if_unresolved" text,
	"evidence_available" varchar(32),
	"desired_outcome" text,
	"proposed_solution" text[] DEFAULT '{}' NOT NULL,
	"existing_system_relation" varchar(16),
	"existing_system_detail" text,
	"data_required" text,
	"integration_required" varchar(16),
	"integration_detail" text,
	"sensitive_data_flag" varchar(16),
	"sensitive_data_detail" text,
	"mobile_field_need" varchar(16),
	"domain_tags" text[] DEFAULT '{}' NOT NULL,
	"expected_benefits" text[] DEFAULT '{}' NOT NULL,
	"baseline" text,
	"target" text,
	"respondent_urgency" varchar(16),
	"urgency_reason" text,
	"external_deadline" text,
	"data_readiness" varchar(16),
	"process_readiness" varchar(16),
	"owner_readiness" varchar(32),
	"dependencies" text,
	"estimated_cost" text,
	"additional_notes" text,
	"status" "need_status" DEFAULT 'draft' NOT NULL,
	"status_reason" text,
	"submitted_at" timestamp with time zone,
	"last_submitted_at" timestamp with time zone,
	"archived_at" timestamp with time zone,
	"archive_reason" text,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "interviews" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"need_id" uuid NOT NULL,
	"objective" text,
	"scheduled_at" timestamp with time zone,
	"participants" text,
	"questions" text,
	"findings" text,
	"current_vs_target" text,
	"verified_baseline" text,
	"dependencies_risks" text,
	"outcome" text,
	"owner_user_id" uuid,
	"due_at" timestamp with time zone,
	"status" "interview_status" DEFAULT 'planned' NOT NULL,
	"shared_with_respondent" boolean DEFAULT false NOT NULL,
	"notes" text,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "need_attachments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"need_id" uuid NOT NULL,
	"storage_key" varchar(255) NOT NULL,
	"original_filename" varchar(255) NOT NULL,
	"mime_type" varchar(128) NOT NULL,
	"size_bytes" integer NOT NULL,
	"uploaded_by" uuid,
	"archived_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "need_reviews" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"need_id" uuid NOT NULL,
	"reviewer_id" uuid,
	"completeness" varchar(32),
	"root_cause_status" varchar(16),
	"duplicate_status" varchar(16),
	"related_need_ids" uuid[] DEFAULT '{}' NOT NULL,
	"solution_category" varchar(32),
	"strategic_alignment" varchar(16),
	"delay_risk" varchar(16),
	"delay_risk_reason" text,
	"follow_up_recommendation" varchar(32),
	"reviewer_notes" text,
	"clarification_questions" text,
	"score_impact" smallint,
	"score_risk" smallint,
	"score_urgency" smallint,
	"score_strategy" smallint,
	"score_readiness" smallint,
	"score_reuse" smallint,
	"score_reason" text,
	"weighted_score" numeric(5, 2),
	"critical_flag" boolean DEFAULT false NOT NULL,
	"critical_reason" text,
	"reviewed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"title" varchar(200) NOT NULL,
	"body" text,
	"link" varchar(500),
	"read_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "period_departments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"period_id" uuid NOT NULL,
	"department_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"token_hash" varchar(128) NOT NULL,
	"user_agent" varchar(500),
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"revoked_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(255) NOT NULL,
	"password_hash" text NOT NULL,
	"full_name" varchar(200) NOT NULL,
	"job_title" varchar(200),
	"role" "user_role" DEFAULT 'respondent' NOT NULL,
	"department_id" uuid,
	"is_active" boolean DEFAULT true NOT NULL,
	"must_change_password" boolean DEFAULT false NOT NULL,
	"failed_login_count" integer DEFAULT 0 NOT NULL,
	"locked_until" timestamp with time zone,
	"last_login_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "app_settings" ADD CONSTRAINT "app_settings_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assessment_periods" ADD CONSTRAINT "assessment_periods_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actor_user_id_users_id_fk" FOREIGN KEY ("actor_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clarification_threads" ADD CONSTRAINT "clarification_threads_need_id_digital_needs_id_fk" FOREIGN KEY ("need_id") REFERENCES "public"."digital_needs"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clarification_threads" ADD CONSTRAINT "clarification_threads_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "department_submissions" ADD CONSTRAINT "department_submissions_period_id_assessment_periods_id_fk" FOREIGN KEY ("period_id") REFERENCES "public"."assessment_periods"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "department_submissions" ADD CONSTRAINT "department_submissions_department_id_departments_id_fk" FOREIGN KEY ("department_id") REFERENCES "public"."departments"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "department_submissions" ADD CONSTRAINT "department_submissions_respondent_id_users_id_fk" FOREIGN KEY ("respondent_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "departments" ADD CONSTRAINT "departments_head_user_id_users_id_fk" FOREIGN KEY ("head_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "digital_needs" ADD CONSTRAINT "digital_needs_submission_id_department_submissions_id_fk" FOREIGN KEY ("submission_id") REFERENCES "public"."department_submissions"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "digital_needs" ADD CONSTRAINT "digital_needs_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "interviews" ADD CONSTRAINT "interviews_need_id_digital_needs_id_fk" FOREIGN KEY ("need_id") REFERENCES "public"."digital_needs"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "interviews" ADD CONSTRAINT "interviews_owner_user_id_users_id_fk" FOREIGN KEY ("owner_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "interviews" ADD CONSTRAINT "interviews_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "need_attachments" ADD CONSTRAINT "need_attachments_need_id_digital_needs_id_fk" FOREIGN KEY ("need_id") REFERENCES "public"."digital_needs"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "need_attachments" ADD CONSTRAINT "need_attachments_uploaded_by_users_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "need_reviews" ADD CONSTRAINT "need_reviews_need_id_digital_needs_id_fk" FOREIGN KEY ("need_id") REFERENCES "public"."digital_needs"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "need_reviews" ADD CONSTRAINT "need_reviews_reviewer_id_users_id_fk" FOREIGN KEY ("reviewer_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "period_departments" ADD CONSTRAINT "period_departments_period_id_assessment_periods_id_fk" FOREIGN KEY ("period_id") REFERENCES "public"."assessment_periods"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "period_departments" ADD CONSTRAINT "period_departments_department_id_departments_id_fk" FOREIGN KEY ("department_id") REFERENCES "public"."departments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_department_id_departments_id_fk" FOREIGN KEY ("department_id") REFERENCES "public"."departments"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "audit_logs_entity_idx" ON "audit_logs" USING btree ("entity_type","entity_id");--> statement-breakpoint
CREATE INDEX "audit_logs_created_idx" ON "audit_logs" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "clarification_threads_need_idx" ON "clarification_threads" USING btree ("need_id");--> statement-breakpoint
CREATE UNIQUE INDEX "department_submissions_uq" ON "department_submissions" USING btree ("period_id","department_id");--> statement-breakpoint
CREATE INDEX "department_submissions_period_idx" ON "department_submissions" USING btree ("period_id");--> statement-breakpoint
CREATE UNIQUE INDEX "departments_code_uq" ON "departments" USING btree ("code");--> statement-breakpoint
CREATE UNIQUE INDEX "digital_needs_code_uq" ON "digital_needs" USING btree ("need_code");--> statement-breakpoint
CREATE INDEX "digital_needs_submission_idx" ON "digital_needs" USING btree ("submission_id");--> statement-breakpoint
CREATE INDEX "digital_needs_status_idx" ON "digital_needs" USING btree ("status");--> statement-breakpoint
CREATE INDEX "digital_needs_urgency_idx" ON "digital_needs" USING btree ("respondent_urgency");--> statement-breakpoint
CREATE INDEX "interviews_need_idx" ON "interviews" USING btree ("need_id");--> statement-breakpoint
CREATE INDEX "need_attachments_need_idx" ON "need_attachments" USING btree ("need_id");--> statement-breakpoint
CREATE UNIQUE INDEX "need_reviews_need_uq" ON "need_reviews" USING btree ("need_id");--> statement-breakpoint
CREATE INDEX "notifications_user_idx" ON "notifications" USING btree ("user_id","read_at");--> statement-breakpoint
CREATE UNIQUE INDEX "period_departments_uq" ON "period_departments" USING btree ("period_id","department_id");--> statement-breakpoint
CREATE UNIQUE INDEX "sessions_token_uq" ON "sessions" USING btree ("token_hash");--> statement-breakpoint
CREATE INDEX "sessions_user_idx" ON "sessions" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "users_email_uq" ON "users" USING btree ("email");--> statement-breakpoint
CREATE INDEX "users_department_idx" ON "users" USING btree ("department_id");