import type {
  InterviewAssignment,
  ApplicationInterviewData,
} from "@app-portal/shared/types";
import type { ApplicantRole } from "@app-portal/shared/constants";
import { getApplicationForm } from "@/services/applicationFormsService";
import { getInterviewDataForAssignment } from "@/services/interviewDataService";
import { reviewCapable } from "@/services/reviewersService";
import { getUserById } from "@/services/userService";
import type { ReviewCapableUser } from "@/types/types";
import { calculateInterviewScore } from "@/utils/scores";
import { useQuery } from "@tanstack/react-query";

export type AssignedAppRow = {
  index: number;
  interviewer: ReviewCapableUser;
  interviewerName: string;
  role: ApplicantRole;
  applicantId: string;
  formId: string;
  score?: {
    value: number;
    outOf: number;
  };
  interview: ApplicationInterviewData | undefined;
  responseId: string;
};

export function useRows(assignments: InterviewAssignment[], formId: string) {
  return useQuery({
    queryKey: [
      "interviewer-assignment-rows",
      assignments.map((a) => a.id).sort(),
      formId,
    ],
    placeholderData: (prev) => prev,
    queryFn: async () => {
      const form = await getApplicationForm(formId);
      return Promise.all(
        assignments.map(async (assignment, index) => {
          const [interviewer, interview] = await Promise.all([
            getUserById(assignment.interviewerId),
            getInterviewDataForAssignment(assignment),
          ]);

          if (!interviewer || !reviewCapable(interviewer))
            throw new Error("Invalid interviewer!");

          const row: AssignedAppRow = {
            interviewer: interviewer,
            applicantId: assignment.applicantId,
            interviewerName: `${interviewer.firstName} ${interviewer.lastName}`,
            index: 1 + index,
            formId: assignment.formId,
            responseId: assignment.applicationResponseId,
            role: assignment.forRole,
            interview: interview,
            score:
              interview && interview.submitted
                ? {
                    value: calculateInterviewScore(interview, form),
                    outOf: 4, // NOTE: All scores are assumed to be out of 4
                  }
                : undefined,
          };

          return row;
        }),
      );
    },
  });
}
