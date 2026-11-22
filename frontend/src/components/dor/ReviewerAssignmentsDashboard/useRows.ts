import { keepPreviousData, skipToken, useQuery } from "@tanstack/react-query";

import { trpc } from "@/config/trpc";
import type { RouterOutputs } from "@/types/trpc";

type ReviewerAssignments = RouterOutputs["rows"]["reviewerAssignments"];
export type AssignedAppRow = ReviewerAssignments["rows"][number];

function reviewerAssignmentsQueryOptions(
  formId: string | undefined,
  reviewerId: string | undefined,
) {
  return trpc.rows.reviewerAssignments.queryOptions(
    formId && reviewerId ? { formId, reviewerId } : skipToken,
    { placeholderData: keepPreviousData },
  );
}

export function useReviewerAssignments(
  formId: string | undefined,
  reviewerId: string | undefined,
) {
  return useQuery(reviewerAssignmentsQueryOptions(formId, reviewerId));
}

export function useRows(
  formId: string | undefined,
  reviewerId: string | undefined,
) {
  return useQuery({
    ...reviewerAssignmentsQueryOptions(formId, reviewerId),
    select: (data: ReviewerAssignments) => data.rows,
  });
}
