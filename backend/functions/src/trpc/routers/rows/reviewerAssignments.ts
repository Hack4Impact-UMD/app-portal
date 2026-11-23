import { FirestoreCollection } from "@app-portal/shared/constants";
import type {
  AppReviewAssignment,
  ApplicationReviewData,
} from "@app-portal/shared/types";
import { calculateReviewScore } from "@app-portal/shared/utils";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

import type { ApplicationForm } from "../../../models/appForm";
import { queryWhereIn } from "../../../utils/batch";
import { appCollection } from "../../../utils/firestore";
import {
  REVIEW_CAPABLE_ROLES,
  scoreWarning,
  requireUser,
  reviewingFor,
  userSummary,
} from "./helpers";
import { loadForm, loadUsers } from "./loaders";
import { superReviewerProcedure } from "./procedures";

async function reviewAssignmentRows(
  assignments: AppReviewAssignment[],
  form: ApplicationForm,
) {
  const reviewerIds = [...new Set(assignments.map((a) => a.reviewerId))];
  const [applicants, reviewData] = await Promise.all([
    loadUsers(assignments.map((a) => a.applicantId)),
    queryWhereIn(
      appCollection(FirestoreCollection.ReviewData).where(
        "applicationFormId",
        "==",
        form.id,
      ),
      "reviewerId",
      reviewerIds,
    ),
  ]);
  const reviewsByAssignment = new Map<string, ApplicationReviewData>();
  for (const review of reviewData) {
    const key = `${review.applicantId}:${review.forRole}:${review.reviewerId}`;
    if (!reviewsByAssignment.has(key)) reviewsByAssignment.set(key, review);
  }

  return assignments.map((assignment, index) => {
    const applicant = requireUser(applicants, assignment.applicantId);
    const review = reviewsByAssignment.get(
      `${assignment.applicantId}:${assignment.forRole}:${assignment.reviewerId}`,
    );

    return {
      applicant: userSummary(applicant),
      applicantId: assignment.applicantId,
      applicantName: `${applicant.firstName} ${applicant.lastName}`,
      index: 1 + index,
      formId: assignment.formId,
      responseId: assignment.applicationResponseId,
      role: assignment.forRole,
      review,
      score:
        review && review.submitted
          ? {
              value: calculateReviewScore(review, form, scoreWarning),
              outOf: 4, // NOTE: All scores are assumed to be out of 4
            }
          : undefined,
    };
  });
}

export const reviewerAssignments = superReviewerProcedure
  .input(z.object({ formId: z.string(), reviewerId: z.string() }))
  .query(async ({ input: { formId, reviewerId } }) => {
    const [form, reviewer, assignments, reviewerData] = await Promise.all([
      loadForm(formId),
      loadUsers([reviewerId]).then((m) => m.get(reviewerId)),
      appCollection(FirestoreCollection.ReviewAssignments)
        .where("formId", "==", formId)
        .where("reviewerId", "==", reviewerId)
        .where("assignmentType", "==", "review")
        .get()
        .then((s) => s.docs.map((d) => d.data())),
      appCollection(FirestoreCollection.ReviewData)
        .where("reviewerId", "==", reviewerId)
        .where("applicationFormId", "==", formId)
        .get()
        .then((s) => s.docs.map((d) => d.data())),
    ]);

    if (!reviewer || !REVIEW_CAPABLE_ROLES.includes(reviewer.role)) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "User is not review capable",
      });
    }

    return {
      reviewer: { ...userSummary(reviewer), roles: reviewingFor(reviewer) },
      numReviewed: reviewerData.filter((r) => r.submitted).length,
      rows: await reviewAssignmentRows(assignments, form),
    };
  });
