import { queryOptions, skipToken, useQuery } from "@tanstack/react-query";

import { getInterviewAssignmentsForApplication } from "@/services/interviewAssignmentService";

const interviewAssignmentRoot = "interview-assignments" as const;

export const interviewAssignmentQueries = {
  root: [interviewAssignmentRoot] as const,
  byResponse: (responseId?: string) =>
    queryOptions({
      queryKey: [interviewAssignmentRoot, "response", responseId] as const,
      queryFn: responseId
        ? () => getInterviewAssignmentsForApplication(responseId)
        : skipToken,
    }),
};

export function useInterviewAssignmentsForResponse(responseId?: string) {
  return useQuery(interviewAssignmentQueries.byResponse(responseId));
}
