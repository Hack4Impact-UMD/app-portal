import type {
  InterviewAssignment,
  ApplicationInterviewData,
} from "@app-portal/shared/types";
import { useQuery } from "@tanstack/react-query";

import type { ReviewCapableUser } from "@/types/types";

export type InterviewerRow = {
  index: number;
  interviewer: {
    name: string;
    id: string;
  };
  //   rolePreferences: ApplicantRole[]; TODO turn this into an interview assignment column once Qualified is merged
  assignments: number;
  pendingAssignments: number;
};

export type FlatInterviewerRow = {
  index: number;
  interviewer_name: string;
  interviewer_id: string;
  //   rolePreferences: string;
  assignments: number;
  pendingAssignments: number;
};

export const interviewerRowsQueryRoot = ["interviewer-rows"] as const;

export function useRows(
  interviewers: ReviewCapableUser[],
  interviewData: ApplicationInterviewData[],
  assignments: InterviewAssignment[],
) {
  return useQuery({
    queryKey: [
      ...interviewerRowsQueryRoot,
      interviewers.map((x) => x.id).sort(),
      interviewData.map((x) => x.id).sort(),
      assignments.map((x) => x.id).sort(),
    ],
    placeholderData: (prev) => prev,
    queryFn: async () => {
      const assignmentsByInterviewer = new Map<string, number>();
      for (const a of assignments) {
        assignmentsByInterviewer.set(
          a.interviewerId,
          (assignmentsByInterviewer.get(a.interviewerId) ?? 0) + 1,
        );
      }

      const submittedByInterviewer = new Map<string, number>();
      for (const d of interviewData) {
        if (d.submitted) {
          submittedByInterviewer.set(
            d.interviewerId,
            (submittedByInterviewer.get(d.interviewerId) ?? 0) + 1,
          );
        }
      }

      return interviewers.map((interviewer, index) => {
        const total = assignmentsByInterviewer.get(interviewer.id) ?? 0;
        const submitted = submittedByInterviewer.get(interviewer.id) ?? 0;

        const row: InterviewerRow = {
          index: index + 1,
          interviewer: {
            id: interviewer.id,
            name: `${interviewer.firstName} ${interviewer.lastName}`,
          },
          assignments: total,
          pendingAssignments: total - submitted,
        };

        return row;
      });
    },
  });
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
