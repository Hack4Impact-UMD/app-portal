import { z } from "zod";

import { listReviewAssignmentsForForm } from "../../../services/reviewAssignments";
import { listReviewDataForForm } from "../../../services/reviewData";
import { listReviewCapableUsers } from "../../../services/users";
import { groupBy } from "../../../utils/batch";
import { reviewingFor } from "./helpers";
import { superReviewerProcedure } from "./procedures";

export const reviewers = superReviewerProcedure
  .input(z.object({ formId: z.string() }))
  .query(async ({ input: { formId } }) => {
    const [reviewers, reviewData, assignments] = await Promise.all([
      listReviewCapableUsers(),
      listReviewDataForForm(formId),
      listReviewAssignmentsForForm(formId),
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
