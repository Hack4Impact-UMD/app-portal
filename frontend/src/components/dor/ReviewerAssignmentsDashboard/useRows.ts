import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { trpc } from "@/config/trpc";
import type { RouterOutputs } from "@/types/trpc";

type ReviewerAssignments = RouterOutputs["rows"]["reviewerAssignments"];
export type AssignedAppRow = ReviewerAssignments["rows"][number];

function reviewerAssignmentsQueryOptions(formId: string, reviewerId: string) {
  return trpc.rows.reviewerAssignments.queryOptions(
    { formId, reviewerId },
    { placeholderData: keepPreviousData },
  );
}

export function useReviewerAssignments(formId: string, reviewerId: string) {
  return useQuery(reviewerAssignmentsQueryOptions(formId, reviewerId));
}

export function useRows(formId: string, reviewerId: string) {
  return useQuery({
    ...reviewerAssignmentsQueryOptions(formId, reviewerId),
    select: (data: ReviewerAssignments) => data.rows,
  });
}
