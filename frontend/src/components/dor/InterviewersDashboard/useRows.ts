import { keepPreviousData, skipToken, useQuery } from "@tanstack/react-query";

import { trpc } from "@/config/trpc";
import type { RouterOutputs } from "@/types/trpc";

export type InterviewerRow = RouterOutputs["rows"]["interviewers"][number];

export type FlatInterviewerRow = {
  index: number;
  interviewer_name: string;
  interviewer_id: string;
  //   rolePreferences: string;
  assignments: number;
  pendingAssignments: number;
};

export function useRows(formId: string | undefined) {
  return useQuery(
    trpc.rows.interviewers.queryOptions(formId ? { formId } : skipToken, {
      placeholderData: keepPreviousData,
    }),
  );
}

export function flattenRows(rows: InterviewerRow[]): FlatInterviewerRow[] {
  return rows.map(
    (row): FlatInterviewerRow => ({
      index: row.index,
      interviewer_name: row.interviewer.name,
      interviewer_id: row.interviewer.id,
      //   rolePreferences: row.rolePreferences.join(";"),
      assignments: row.assignments,
      pendingAssignments: row.pendingAssignments,
    }),
  );
}
