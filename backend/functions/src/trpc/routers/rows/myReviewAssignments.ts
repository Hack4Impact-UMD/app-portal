import { FirestoreCollection } from "@app-portal/shared/constants";
import { calculateReviewScore } from "@app-portal/shared/utils";
import { z } from "zod";

import { getDocsById } from "../../../utils/batch";
import { appCollection } from "../../../utils/firestore";
import { scoreWarning, firstByApplicantRole } from "./helpers";
import {
  loadForm,
  responseRoleKey,
  loadPreviouslyAppliedCounts,
  loadUsers,
} from "./loaders";
import { reviewCapableProcedure } from "./procedures";

export const myReviewAssignments = reviewCapableProcedure
  .input(z.object({ formId: z.string() }))
  .query(async ({ input: { formId }, ctx }) => {
    const reviewerId = ctx.token.uid;
    const [form, assignments, myReviews] = await Promise.all([
      loadForm(formId),
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

    const applicantIds = [...new Set(assignments.map((a) => a.applicantId))];
    const [applicants, responses, previouslyApplied] = await Promise.all([
      loadUsers(applicantIds),
      getDocsById(
        appCollection(FirestoreCollection.ApplicationResponses),
        assignments.map((a) => a.applicationResponseId),
      ),
      loadPreviouslyAppliedCounts(applicantIds),
    ]);
    const reviewByKey = firstByApplicantRole(myReviews);

    const rows = assignments.map((assignment, index) => {
      const user = applicants.get(assignment.applicantId);
      const review = reviewByKey.get(
        `${assignment.applicantId}:${assignment.forRole}`,
      );
      const response = responses.get(assignment.applicationResponseId);

      return {
        index: 1 + index,
        applicant: {
          id: user?.id ?? "error",
          name: `${user?.firstName ?? "Error"} ${user?.lastName ?? "Error"}`,
          previouslyAppliedCount:
            previouslyApplied.get(assignment.applicantId) ?? 0,
        },
        responseId: assignment.applicationResponseId,
        role: assignment.forRole,
        review,
        dateSubmitted: response?.dateSubmitted,
        score: {
          value:
            review && review.submitted
              ? calculateReviewScore(review, form, scoreWarning)
              : undefined,
          outOf: 4, // NOTE: All scores are assummed to be out of 4
        },
      };
    });

    const submittedKeys = new Set(
      myReviews
        .filter((r) => r.submitted)
        .map((r) => responseRoleKey(r.applicationResponseId, r.forRole)),
    );

    return {
      numReviewed: assignments.filter((a) =>
        submittedKeys.has(responseRoleKey(a.applicationResponseId, a.forRole)),
      ).length,
      rows,
    };
  });
