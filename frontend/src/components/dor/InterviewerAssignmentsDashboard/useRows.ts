import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { trpc } from "@/config/trpc";
import type { RouterOutputs } from "@/types/trpc";

type InterviewerAssignments = RouterOutputs["rows"]["interviewerAssignments"];
export type AssignedInterviewRow = InterviewerAssignments["rows"][number];

function interviewerAssignmentsQueryOptions(
  formId: string,
  interviewerId: string,
) {
  return trpc.rows.interviewerAssignments.queryOptions(
    { formId, interviewerId },
    { placeholderData: keepPreviousData },
  );
}

export function useInterviewerAssignments(
  formId: string,
  interviewerId: string,
) {
  return useQuery(interviewerAssignmentsQueryOptions(formId, interviewerId));
}

export function useRows(formId: string, interviewerId: string) {
  return useQuery({
    ...interviewerAssignmentsQueryOptions(formId, interviewerId),
    select: (data: InterviewerAssignments) => data.rows,
  });
}
