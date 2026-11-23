import { skipToken, useQuery } from "@tanstack/react-query";

import { trpc } from "@/config/trpc";

export function useInterviewAssignmentsForResponse(responseId?: string) {
  return useQuery(
    trpc.interviewAssignments.listForResponse.queryOptions(
      responseId ? { responseId } : skipToken,
    ),
  );
}
