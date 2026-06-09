import type { ApplicantRole } from "@app-portal/shared/constants";
import type {
  AppReviewAssignment,
  ApplicationReviewData,
} from "@app-portal/shared/types";
import { useQuery } from "@tanstack/react-query";

import { reviewingFor } from "@/services/reviewersService";
import type { ReviewCapableUser } from "@/types/types";

export type ReviewerRow = {
  index: number;
  reviewer: {
    name: string;
    id: string;
  };
  rolePreferences: ApplicantRole[];
  assignments: number;
  pendingAssignments: number;
};

export type FlatReviewerRow = {
  index: number;
  reviewer_name: string;
  reviewer_id: string;
  rolePreferences: string;
  assignments: number;
  pendingAssignments: number;
};

export const reviewerRowsQueryRoot = ["reviewer-rows"] as const;

export function useRows(
  reviewers: ReviewCapableUser[],
  assignments: AppReviewAssignment[],
  reviewData: ApplicationReviewData[],
) {
  return useQuery({
    queryKey: [
      ...reviewerRowsQueryRoot,
      reviewers
        .map((r) => `${r.id}-${reviewingFor(r).sort().join(",")}`)
        .sort(),
      assignments.map((x) => x.id).sort(),
      reviewData.map((x) => x.id).sort(),
    ],
    placeholderData: (prev) => prev,
    queryFn: async () => {
      const assignmentsByReviewer = new Map<string, number>();
      for (const a of assignments) {
        assignmentsByReviewer.set(
          a.reviewerId,
          (assignmentsByReviewer.get(a.reviewerId) ?? 0) + 1,
        );
      }

      const submittedByReviewer = new Map<string, number>();
      for (const d of reviewData) {
        if (d.submitted) {
          submittedByReviewer.set(
            d.reviewerId,
            (submittedByReviewer.get(d.reviewerId) ?? 0) + 1,
          );
        }
      }

      return Promise.all(
        reviewers.map(async (reviewer, index) => {
          const assigned = assignmentsByReviewer.get(reviewer.id) ?? 0;
          const submitted = submittedByReviewer.get(reviewer.id) ?? 0;

          const row: ReviewerRow = {
            index: 1 + index,
            reviewer: {
              id: reviewer.id,
              name: `${reviewer.firstName} ${reviewer.lastName}`,
            },
            rolePreferences: reviewingFor(reviewer),
            assignments: assigned,
            pendingAssignments: assigned - submitted,
          };

          return row;
        }),
      );
    },
  });
}

export function flattenRows(rows: ReviewerRow[]): FlatReviewerRow[] {
  return rows.map(
    (row): FlatReviewerRow => ({
      index: row.index,
      reviewer_name: row.reviewer.name,
      reviewer_id: row.reviewer.id,
      rolePreferences: row.rolePreferences.join(";"),
      assignments: row.assignments,
      pendingAssignments: row.pendingAssignments,
    }),
  );
}
