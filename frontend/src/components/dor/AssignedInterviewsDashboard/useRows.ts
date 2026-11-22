import { keepPreviousData, skipToken, useQuery } from "@tanstack/react-query";

import { trpc } from "@/config/trpc";
import type { RouterOutputs } from "@/types/trpc";

type AssignedInterviews = RouterOutputs["rows"]["assignedInterviews"];
export type AssignedAppRow = AssignedInterviews["rows"][number];

function assignedInterviewsQueryOptions(responseId: string | undefined) {
  return trpc.rows.assignedInterviews.queryOptions(
    responseId ? { responseId } : skipToken,
    { placeholderData: keepPreviousData },
  );
}

export function useAssignedInterviews(responseId: string | undefined) {
  return useQuery(assignedInterviewsQueryOptions(responseId));
}

export function useRows(responseId: string | undefined) {
  return useQuery({
    ...assignedInterviewsQueryOptions(responseId),
    select: (data: AssignedInterviews) => data.rows,
  });
}
