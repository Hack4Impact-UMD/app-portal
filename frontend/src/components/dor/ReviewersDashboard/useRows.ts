import { keepPreviousData, skipToken, useQuery } from "@tanstack/react-query";

import { trpc } from "@/config/trpc";
import type { RouterOutputs } from "@/types/trpc";

export type ReviewerRow = RouterOutputs["rows"]["reviewers"][number];

export type FlatReviewerRow = {
  index: number;
  reviewer_name: string;
  reviewer_id: string;
  rolePreferences: string;
  assignments: number;
  pendingAssignments: number;
};

export const reviewerRowsQueryRoot = trpc.rows.reviewers.pathKey();

export function useRows(formId: string | undefined) {
  return useQuery(
    trpc.rows.reviewers.queryOptions(formId ? { formId } : skipToken, {
      placeholderData: keepPreviousData,
    }),
  );
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
