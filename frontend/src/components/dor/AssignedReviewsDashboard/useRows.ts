import type { ApplicantRole } from "@app-portal/shared/constants";
import type {
  AppReviewAssignment,
  ApplicationReviewData,
} from "@app-portal/shared/types";
import { useQuery } from "@tanstack/react-query";

import { getApplicationForm } from "@/services/applicationFormsService";
import { getReviewDataForAssignment } from "@/services/reviewDataService";
import { reviewCapable } from "@/services/reviewersService";
import { getUserById } from "@/services/userService";
import type { ReviewCapableUser } from "@/types/types";
import { calculateReviewScore } from "@/utils/scores";

export type AssignedAppRow = {
  index: number;
  reviewer: ReviewCapableUser;
  reviewerName: string;
  role: ApplicantRole;
  applicantId: string;
  formId: string;
  score?: {
    value: number;
    outOf: number;
  };
  review: ApplicationReviewData | undefined;
  responseId: string;
};

const assignedReviewRowsQueryRoot = ["assigned-review-rows"] as const;

export function useRows(assignments: AppReviewAssignment[], formId: string) {
  return useQuery({
    queryKey: [
      ...assignedReviewRowsQueryRoot,
      assignments.map((a) => a.id).sort(),
      formId,
    ],
    placeholderData: (prev) => prev,
    queryFn: async () => {
      const form = await getApplicationForm(formId);
      return Promise.all(
        assignments.map(async (assignment, index) => {
          const [reviewer, review] = await Promise.all([
            getUserById(assignment.reviewerId),
            getReviewDataForAssignment(assignment),
          ]);

          if (!reviewer || !reviewCapable(reviewer))
            throw new Error("Invalid reviewer!");

          const row: AssignedAppRow = {
            reviewer: reviewer,
            applicantId: assignment.applicantId,
            reviewerName: `${reviewer.firstName} ${reviewer.lastName}`,
            index: 1 + index,
            formId: assignment.formId,
            responseId: assignment.applicationResponseId,
            role: assignment.forRole,
            review: review,
            score:
              review && review.submitted
                ? {
                    value: calculateReviewScore(review, form),
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
