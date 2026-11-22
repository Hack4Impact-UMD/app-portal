import { FirestoreCollection } from "@app-portal/shared/constants";
import { z } from "zod";

import { groupBy } from "../../../utils/batch";
import { appCollection } from "../../../utils/firestore";
import { reviewingFor } from "./helpers";
import { loadReviewCapableUsers } from "./loaders";
import { superReviewerProcedure } from "./procedures";

export const reviewers = superReviewerProcedure
  .input(z.object({ formId: z.string() }))
  .query(async ({ input: { formId } }) => {
    const [reviewers, reviewData, assignments] = await Promise.all([
      loadReviewCapableUsers(),
      appCollection(FirestoreCollection.ReviewData)
        .where("applicationFormId", "==", formId)
        .get()
        .then((s) => s.docs.map((d) => d.data())),
      appCollection(FirestoreCollection.ReviewAssignments)
        .where("formId", "==", formId)
        .get()
        .then((s) => s.docs.map((d) => d.data())),
    ]);

    const assignmentsByReviewer = groupBy(assignments, (a) => a.reviewerId);
    const dataByReviewer = groupBy(reviewData, (d) => d.reviewerId);

    return reviewers.map((reviewer, index) => {
      const assigned = assignmentsByReviewer.get(reviewer.id)?.length ?? 0;
      const data = dataByReviewer.get(reviewer.id) ?? [];
      const submitted = data.filter((d) => d.submitted).length;

      return {
        index: 1 + index,
        reviewer: {
          id: reviewer.id,
          name: `${reviewer.firstName} ${reviewer.lastName}`,
        },
        rolePreferences: reviewingFor(reviewer),
        assignments: assigned,
        pendingAssignments: assigned - submitted,
        reviewDataCount: data.length,
      };
    });
  });
