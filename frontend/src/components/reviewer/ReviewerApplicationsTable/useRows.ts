import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { trpc } from "@/config/trpc";
import type { RouterOutputs } from "@/types/trpc";

type MyReviewAssignments = RouterOutputs["rows"]["myReviewAssignments"];
export type AssignmentRow = MyReviewAssignments["rows"][number];

function myReviewAssignmentsQueryOptions(formId: string) {
  return trpc.rows.myReviewAssignments.queryOptions(
    { formId },
    { placeholderData: keepPreviousData },
  );
}

export function useMyReviewAssignmentRows(formId: string) {
  return useQuery(myReviewAssignmentsQueryOptions(formId));
}

export function useRows(formId: string) {
  return useQuery({
    ...myReviewAssignmentsQueryOptions(formId),
    select: (data: MyReviewAssignments) => data.rows,
  });
}
