import type { ApplicantRole } from "@app-portal/shared/constants";
import type {
  ApplicationInterviewData,
  InterviewAssignment,
  InternalApplicationStatus,
} from "@app-portal/shared/types";
import { getApplicantById } from "@/services/applicantService";
import { getApplicationForm } from "@/services/applicationFormsService";
import { getInterviewAssignmentsForApplication } from "@/services/interviewAssignmentService";
import { getInterviewDataForResponseRole } from "@/services/interviewDataService";
import { reviewCapable } from "@/services/reviewersService";
import { getApplicationStatusForResponseRole } from "@/services/statusService";
import { getUserById } from "@/services/userService";
import type {
  ApplicationResponse,
  ReviewCapableUser,
  CsvRow,
} from "@/types/types";
import { calculateInterviewScore } from "@/utils/scores";
import { useQuery } from "@tanstack/react-query";
import type { Timestamp } from "firebase/firestore";

export type QualifiedAppRow = {
  index: number;
  dateSubmitted: Timestamp;
  name: string;
  email: string;
  role: ApplicantRole;
  interviewers: {
    assigned: ReviewCapableUser[];
  };
  assignments: InterviewAssignment[];
  averageScore: number | null;
  individualScores: number[];
  responseId: string;
  interviews: ApplicationInterviewData[];
  status?: InternalApplicationStatus;
  internal: boolean;
};

export function useRows(applications: ApplicationResponse[], formId: string) {
  return useQuery<QualifiedAppRow[]>({
    queryKey: [
      "qualified-apps-rows",
      formId,
      applications.map((x) => x.id).sort(),
    ],
    placeholderData: (prev) => prev,
    queryFn: async () => {
      const form = await getApplicationForm(formId);
      return Promise.all(
        applications.map(async (app, index) => {
          const user = await getApplicantById(app.userId);
          // Get interview assignments for this application
          const assignments = (
            await getInterviewAssignmentsForApplication(app.id)
          ).filter((a) => a.forRole === app.rolesApplied[0]);
          // Get all assigned interviewer profiles
          const assignedInterviewers: ReviewCapableUser[] = (
            await Promise.all(
              assignments.map((a) => getUserById(a.interviewerId)),
            )
          ).filter((u) => reviewCapable(u));
          // Get interview data for this application/role
          const interviews = await getInterviewDataForResponseRole(
            formId,
            app.id,
            app.rolesApplied[0],
          );
          const submittedInterviews = interviews.filter((i) => i.submitted);
          const individualScores =
            submittedInterviews.length > 0
              ? await Promise.all(
                  submittedInterviews.map((i) =>
                    calculateInterviewScore(i, form),
                  ),
                )
              : [];
          const averageScore =
            individualScores.length > 0
              ? individualScores.reduce((acc, v) => acc + v, 0) /
                individualScores.length
              : null;
          const status = await getApplicationStatusForResponseRole(
            app.id,
            app.rolesApplied[0],
          );
          return {
            index: 1 + index,
            dateSubmitted: app.dateSubmitted,
            name: `${user.firstName} ${user.lastName}`,
            email: user.email,
            role: app.rolesApplied[0],
            interviewers: { assigned: assignedInterviewers },
            assignments,
            averageScore,
            individualScores,
            responseId: app.id,
            interviews,
            status,
            internal: user.isInternal ?? false,
          };
        }),
      );
    },
    refetchOnWindowFocus: true,
  });
}

export function flattenRows(
  rows: QualifiedAppRow[],
  role: ApplicantRole,
): CsvRow[] {
  const filteredRows = rows.filter((row) => row.role === role);

  if (filteredRows.length === 0) return [];

  const sampleInterview = filteredRows
    .flatMap((r) => r.interviews.filter((i) => i.submitted))
    .find((i) => i !== undefined);

  const scoreKeys = sampleInterview
    ? Object.keys(sampleInterview.interviewScores).sort()
    : [];
  const noteKeys = sampleInterview
    ? Object.keys(sampleInterview.interviewerNotes).sort()
    : [];

  return filteredRows.map((row) => {
    const flat: CsvRow = {
      Name: row.name,
      Role: row.role,
      "Average Interview Score": row.averageScore ?? "",
    };

    const submittedInterviews = row.interviews.filter((i) => i.submitted);

    for (let i = 0; i < 2; i++) {
      const interview = submittedInterviews[i];
      const n = i + 1;

      if (interview && row.individualScores[i] !== undefined) {
        flat[`Interview ${n} - Overall Score`] = row.individualScores[i];
        scoreKeys.forEach((key) => {
          flat[`Interview ${n} - ${key}`] =
            interview.interviewScores[key] ?? "";
        });
        noteKeys.forEach((key) => {
          flat[`Interview ${n} Notes - ${key}`] =
            interview.interviewerNotes[key] ?? "";
        });
      } else {
        flat[`Interview ${n} - Overall Score`] = "";
        scoreKeys.forEach((key) => {
          flat[`Interview ${n} - ${key}`] = "";
        });
        noteKeys.forEach((key) => {
          flat[`Interview ${n} Notes - ${key}`] = "";
        });
      }
    }

    return flat;
  });
}
