import type { NeedStatus } from "@/lib/db/schema";

/** Transisi status yang diizinkan bagi Tim Assessment TI / Admin. */
export const STAFF_TRANSITIONS: Record<NeedStatus, NeedStatus[]> = {
  draft: [],
  submitted: ["under_review", "clarification_required", "returned_for_revision"],
  under_review: ["clarification_required", "returned_for_revision", "interview_scheduled", "validated", "deferred", "rejected"],
  clarification_required: ["under_review", "validated", "interview_scheduled", "returned_for_revision"],
  returned_for_revision: ["under_review"],
  interview_scheduled: ["interview_completed", "under_review"],
  interview_completed: ["validated", "clarification_required", "deferred", "rejected", "under_review"],
  validated: ["prioritized", "deferred", "rejected", "under_review"],
  prioritized: ["closed", "deferred", "validated"],
  deferred: ["under_review", "closed"],
  rejected: ["under_review", "closed"],
  closed: ["under_review"],
  archived: [],
};

export const REASON_REQUIRED: NeedStatus[] = ["returned_for_revision", "clarification_required", "deferred", "rejected"];

/** Status yang memberi notifikasi ke responden. */
export const NOTIFY_RESPONDENT: NeedStatus[] = [
  "returned_for_revision",
  "clarification_required",
  "interview_scheduled",
  "validated",
  "prioritized",
  "deferred",
  "rejected",
  "closed",
];

export const INTERVIEW_STATUSES: NeedStatus[] = ["interview_scheduled", "interview_completed"];
