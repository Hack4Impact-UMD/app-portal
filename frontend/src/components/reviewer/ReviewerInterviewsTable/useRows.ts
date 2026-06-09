import type { ApplicantRole } from "@app-portal/shared/constants";
import type {
  InterviewAssignment,
  ApplicationInterviewData,
} from "@app-portal/shared/types";
import { useQuery } from "@tanstack/react-query";

import { getApplicantById } from "@/services/applicantService";
import { getApplicationForm } from "@/services/applicationFormsService";
import { getInterviewDataForAssignment } from "@/services/interviewDataService";
import type { ApplicantUserProfile } from "@/types/types";
import { calculateInterviewScore } from "@/utils/scores";

export type InterviewAssignmentRow = {
  index: number;
  applicant: ApplicantUserProfile;
  applicantName: string;
  role: ApplicantRole;
  responseId: string;
  score?: {
    value: number;
    outOf: number;
  };
  interviewReviewData?: ApplicationInterviewData;
};

export const reviewerInterviewRowsQueryRoot = [
  "reviewer-interview-rows",
] as const;

export function useRows(
  interviewAssignments: InterviewAssignment[],
  formId: string,
) {
  return useQuery({
    queryKey: [...reviewerInterviewRowsQueryRoot, "form", formId],
    placeholderData: (prev) => prev,
    queryFn: async () => {
      const form = await getApplicationForm(formId);
      return Promise.all(
        interviewAssignments.map(async (assignment, index) => {
          const applicant = await getApplicantById(assignment.applicantId);
          const reviewData = await getInterviewDataForAssignment(assignment);

          const row: InterviewAssignmentRow = {
            index: 1 + index,
            applicant: applicant,
            applicantName: `${applicant.firstName} ${applicant.lastName}`,
            role: assignment.forRole,
            responseId: assignment.applicationResponseId,
            interviewReviewData: reviewData,
            score: reviewData
              ? {
                  value: calculateInterviewScore(reviewData, form),
                  outOf: 4,
                }
              : undefined,
          };

          return row;
        }),
      );
    },
  });
}
