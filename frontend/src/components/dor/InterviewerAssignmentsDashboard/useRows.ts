import type {
  InterviewAssignment,
  ApplicationInterviewData,
} from "@app-portal/shared/types";
import type { ApplicantRole } from "@app-portal/shared/constants";
import { getApplicationForm } from "@/services/applicationFormsService";
import { getInterviewDataForAssignment } from "@/services/interviewDataService";
import { getUserById } from "@/services/userService";
import type { ApplicantUserProfile } from "@/types/types";
import { PermissionRole } from "@/types/types";
import { calculateInterviewScore } from "@/utils/scores";
import { useQuery } from "@tanstack/react-query";

export type AssignedInterviewRow = {
  index: number;
  applicant: ApplicantUserProfile;
  applicantName: string;
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
      "application-assignment-rows",
      assignments.map((x) => x.id).sort(),
      formId,
    ],
    placeholderData: (prev) => prev,
    queryFn: async () => {
      const form = await getApplicationForm(formId);
      return Promise.all(
        assignments.map(async (assignment, index) => {
          const [applicant, interview] = await Promise.all([
            getUserById(assignment.applicantId),
            getInterviewDataForAssignment(assignment),
          ]);

          if (applicant.role !== PermissionRole.Applicant)
            throw new Error(`User ${applicant.id} is not an applicant`);

          const row: AssignedInterviewRow = {
            applicant: applicant,
            applicantId: assignment.applicantId,
            applicantName: `${applicant.firstName} ${applicant.lastName}`,
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
