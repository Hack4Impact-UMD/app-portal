import { keepPreviousData, skipToken, useQuery } from "@tanstack/react-query";

import { trpc } from "@/config/trpc";
import type { RouterOutputs } from "@/types/trpc";

type AssignedReviews = RouterOutputs["rows"]["assignedReviews"];
export type AssignedAppRow = AssignedReviews["rows"][number];

function assignedReviewsQueryOptions(responseId: string | undefined) {
  return trpc.rows.assignedReviews.queryOptions(
    responseId ? { responseId } : skipToken,
    { placeholderData: keepPreviousData },
  );
}

export function useAssignedReviews(responseId: string | undefined) {
  return useQuery(assignedReviewsQueryOptions(responseId));
}

export function useRows(responseId: string | undefined) {
  return useQuery({
    ...assignedReviewsQueryOptions(responseId),
    select: (data: AssignedReviews) => data.rows,
  });
}
