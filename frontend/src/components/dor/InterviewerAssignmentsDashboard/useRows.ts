import { keepPreviousData, skipToken, useQuery } from "@tanstack/react-query";

import { trpc } from "@/config/trpc";
import type { RouterOutputs } from "@/types/trpc";

type InterviewerAssignments = RouterOutputs["rows"]["interviewerAssignments"];
export type AssignedInterviewRow = InterviewerAssignments["rows"][number];

function interviewerAssignmentsQueryOptions(
  formId: string | undefined,
  interviewerId: string | undefined,
) {
  return trpc.rows.interviewerAssignments.queryOptions(
    formId && interviewerId ? { formId, interviewerId } : skipToken,
    { placeholderData: keepPreviousData },
  );
}

export function useInterviewerAssignments(
  formId: string | undefined,
  interviewerId: string | undefined,
) {
  return useQuery(interviewerAssignmentsQueryOptions(formId, interviewerId));
}

export function useRows(
  formId: string | undefined,
  interviewerId: string | undefined,
) {
  return useQuery({
    ...interviewerAssignmentsQueryOptions(formId, interviewerId),
    select: (data: InterviewerAssignments) => data.rows,
  });
}
