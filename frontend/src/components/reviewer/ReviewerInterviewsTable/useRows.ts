import { keepPreviousData, skipToken, useQuery } from "@tanstack/react-query";

import { trpc } from "@/config/trpc";
import type { RouterOutputs } from "@/types/trpc";

type MyInterviewAssignments = RouterOutputs["rows"]["myInterviewAssignments"];
export type InterviewAssignmentRow = MyInterviewAssignments["rows"][number];

function myInterviewAssignmentsQueryOptions(formId?: string) {
  return trpc.rows.myInterviewAssignments.queryOptions(
    formId ? { formId } : skipToken,
    { placeholderData: keepPreviousData },
  );
}

export function useMyInterviewAssignmentRows(formId?: string) {
  return useQuery(myInterviewAssignmentsQueryOptions(formId));
}

export function useRows(formId: string) {
  return useQuery({
    ...myInterviewAssignmentsQueryOptions(formId),
    select: (data: MyInterviewAssignments) => data.rows,
  });
}
