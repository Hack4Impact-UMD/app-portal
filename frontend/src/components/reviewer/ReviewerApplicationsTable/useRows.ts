import type { ApplicantRole } from "@app-portal/shared/constants";
import type {
  AppReviewAssignment,
  ApplicationReviewData,
} from "@app-portal/shared/types";
import { useQuery } from "@tanstack/react-query";
import type { Timestamp } from "firebase/firestore";

import { getApplicantById } from "@/services/applicantService";
import { getApplicationForm } from "@/services/applicationFormsService";
import { getApplicationResponseById } from "@/services/applicationResponsesService";
import { getPreviouslyAppliedCount } from "@/services/previouslyAppliedService";
import { getReviewDataForAssignment } from "@/services/reviewDataService";
import { calculateReviewScore } from "@/utils/scores";

export type AssignmentRow = {
  index: number;
  applicant: {
    name: string;
    id: string;
    previouslyAppliedCount: number;
  };
  responseId: string;
  dateSubmitted?: Timestamp;
  role: ApplicantRole;
  review?: ApplicationReviewData;
  score: {
    value?: number;
    outOf?: number;
  };
};

export const reviewerApplicationRowsQueryRoot = [
  "reviewer-application-rows",
] as const;

export function useRows(assignments: AppReviewAssignment[], formId: string) {
  return useQuery({
    queryKey: [
      ...reviewerApplicationRowsQueryRoot,
      assignments.map((a) => a.id).sort(),
      formId,
    ],
    placeholderData: (prev) => prev,
    queryFn: async () => {
      const form = await getApplicationForm(formId);
      return Promise.all(
        assignments.map(async (assignment, index) => {
          console.log(
            `Loading data for row ${index}, assignemnt ${assignment}...`,
          );

          const user = await getApplicantById(assignment.applicantId).catch(
            (e) => {
              console.error(
                "Failed to load user with ID: ",
                assignment.applicantId,
              );
              console.error(e);
              return undefined;
            },
          );
          const review = await getReviewDataForAssignment(assignment).catch(
            (e) => {
              console.error(
                "Failed to load review data for assignemnt: ",
                assignment,
              );
              console.error(e);
              return undefined;
            },
          );

          const response = await getApplicationResponseById(
            assignment.applicationResponseId,
          ).catch((e) => {
            console.error(
              "Failed to fetch application response for assignment",
              assignment,
            );
            console.error(e);
            return undefined;
          });

          console.log("Successfully loaded row for assignemnt:", assignment);

          const numPreviouslyApplied = await getPreviouslyAppliedCount(
            assignment.applicantId,
          );

          const row: AssignmentRow = {
            index: 1 + index,
            applicant: {
              id: user?.id ?? "error",
              name: `${user?.firstName ?? "Error"} ${user?.lastName ?? "Error"}`,
              previouslyAppliedCount: numPreviouslyApplied,
            },
            responseId: assignment.applicationResponseId,
            role: assignment.forRole,
            review: review,
            dateSubmitted: response?.dateSubmitted,
            score: {
              value:
                review && review.submitted
                  ? calculateReviewScore(review, form)
                  : undefined,
              outOf: 4, // NOTE: All scores are assummed to be out of 4
            },
          };

          return row;
        }),
      );
    },
  });
}
