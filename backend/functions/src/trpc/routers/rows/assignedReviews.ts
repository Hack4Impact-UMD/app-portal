import type { ApplicationReviewData } from "@app-portal/shared/types";
import { calculateReviewScore } from "@app-portal/shared/utils";
import { z } from "zod";

import { isReviewCapable } from "../../../models/user";
import { listReviewAssignmentsForResponse } from "../../../services/reviewAssignments";
import { listReviewDataForResponse } from "../../../services/reviewData";
import { getUsers } from "../../../services/users";
import { requireForm, requireResponse } from "../../required";
import {
  scoreWarning,
  assignedUserName,
  requireUser,
  userSummary,
} from "./helpers";
import { boardProcedure } from "./procedures";

export const assignedReviews = boardProcedure
  .input(z.object({ responseId: z.string() }))
  .query(async ({ input: { responseId } }) => {
    const [response, assignments, reviewData] = await Promise.all([
      requireResponse(responseId),
      listReviewAssignmentsForResponse(responseId),
      listReviewDataForResponse(responseId),
    ]);

    const [form, users] = await Promise.all([
      requireForm(response.applicationFormId),
      getUsers([response.userId, ...assignments.map((a) => a.reviewerId)]),
    ]);

    const reviewByKey = new Map<string, ApplicationReviewData>();
    for (const review of reviewData) {
      const key = `${review.applicantId}:${review.forRole}:${review.applicationFormId}:${review.reviewerId}`;
      if (!reviewByKey.has(key)) reviewByKey.set(key, review);
    }

    const rows = assignments.map((assignment, index) => {
      const reviewer = users.get(assignment.reviewerId);
      const review = reviewByKey.get(
        `${assignment.applicantId}:${assignment.forRole}:${assignment.formId}:${assignment.reviewerId}`,
      );

      return {
        reviewer: reviewer && isReviewCapable(reviewer) ? reviewer : undefined,
        applicantId: assignment.applicantId,
        reviewerName: assignedUserName(reviewer, "reviewer"),
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

    return {
      applicant: userSummary(requireUser(users, response.userId)),
      response,
      numReviewed: reviewData.filter((r) => r.submitted).length,
      rows,
    };
  });
