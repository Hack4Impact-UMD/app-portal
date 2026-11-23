import type {
  AppReviewAssignment,
  ApplicationReviewData,
} from "@app-portal/shared/types";
import { calculateReviewScore } from "@app-portal/shared/utils";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

import type { ApplicationForm } from "../../../models/appForm";
import { listReviewAssignmentsForReviewer } from "../../../services/reviewAssignments";
import {
  listReviewDataForReviewer,
  listReviewDataForReviewers,
} from "../../../services/reviewData";
import { getUser, getUsers } from "../../../services/users";
import { requireForm } from "../../required";
import {
  scoreWarning,
  requireUser,
  reviewingFor,
  userSummary,
} from "./helpers";
import { superReviewerProcedure } from "./procedures";

async function reviewAssignmentRows(
  assignments: AppReviewAssignment[],
  form: ApplicationForm,
) {
  const reviewerIds = [...new Set(assignments.map((a) => a.reviewerId))];
  const [applicants, reviewData] = await Promise.all([
    getUsers(assignments.map((a) => a.applicantId)),
    listReviewDataForReviewers(form.id, reviewerIds),
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
      requireForm(formId),
      getUser(reviewerId),
      listReviewAssignmentsForReviewer(formId, reviewerId),
      listReviewDataForReviewer(formId, reviewerId),
    ]);

    if (!reviewer) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "User not found",
      });
    }

    return {
      reviewer: { ...userSummary(reviewer), roles: reviewingFor(reviewer) },
      numReviewed: reviewerData.filter((r) => r.submitted).length,
      rows: await reviewAssignmentRows(assignments, form),
    };
  });
