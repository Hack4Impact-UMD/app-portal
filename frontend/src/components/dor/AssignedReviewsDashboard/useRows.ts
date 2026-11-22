import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { trpc } from "@/config/trpc";
import type { RouterOutputs } from "@/types/trpc";

type AssignedReviews = RouterOutputs["rows"]["assignedReviews"];
export type AssignedAppRow = AssignedReviews["rows"][number];

function assignedReviewsQueryOptions(responseId: string) {
  return trpc.rows.assignedReviews.queryOptions(
    { responseId },
    { placeholderData: keepPreviousData },
  );
}

export function useAssignedReviews(responseId: string) {
  return useQuery(assignedReviewsQueryOptions(responseId));
}

export function useRows(responseId: string) {
  return useQuery({
    ...assignedReviewsQueryOptions(responseId),
    select: (data: AssignedReviews) => data.rows,
  });
}
