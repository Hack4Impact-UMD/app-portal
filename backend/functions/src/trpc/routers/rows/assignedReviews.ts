import { FirestoreCollection } from "@app-portal/shared/constants";
import type { ApplicationReviewData } from "@app-portal/shared/types";
import { calculateReviewScore } from "@app-portal/shared/utils";
import { z } from "zod";

import type { ApplicantProfile } from "../../../models/user";
import { appCollection } from "../../../utils/firestore";
import {
  scoreWarning,
  isReviewCapable,
  assignedUserName,
  requireUser,
} from "./helpers";
import { loadForm, loadUsers, loadResponse } from "./loaders";
import { superReviewerProcedure } from "./procedures";

export const assignedReviews = superReviewerProcedure
  .input(z.object({ responseId: z.string() }))
  .query(async ({ input: { responseId } }) => {
    const [response, assignments, reviewData] = await Promise.all([
      loadResponse(responseId),
      appCollection(FirestoreCollection.ReviewAssignments)
        .where("applicationResponseId", "==", responseId)
        .get()
        .then((s) => s.docs.map((d) => d.data())),
      appCollection(FirestoreCollection.ReviewData)
        .where("applicationResponseId", "==", responseId)
        .get()
        .then((s) => s.docs.map((d) => d.data())),
    ]);

    const [form, users] = await Promise.all([
      loadForm(response.applicationFormId),
      loadUsers([response.userId, ...assignments.map((a) => a.reviewerId)]),
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
      applicant: requireUser(users, response.userId) as ApplicantProfile,
      response,
      numReviewed: reviewData.filter((r) => r.submitted).length,
      rows,
    };
  });
