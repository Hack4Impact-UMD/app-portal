import { getApplicantById } from "@/services/applicantService";
import { getApplicationForm } from "@/services/applicationFormsService";
import { getPreviouslyAppliedCount } from "@/services/previouslyAppliedService";
import { getReviewAssignmentsForApplication } from "@/services/reviewAssignmentService";
import { getReviewDataForResponseRole } from "@/services/reviewDataService";
import { getApplicationStatusForResponseRole } from "@/services/statusService";
import { getUserById } from "@/services/userService";
import {
  AppReviewAssignment,
  ApplicantRole,
  ApplicationResponse,
  ApplicationReviewData,
  InternalApplicationStatus,
  ReviewCapableUser,
  CsvRow,
} from "@/types/types";
import { calculateReviewScore } from "@/utils/scores";
import { useQuery } from "@tanstack/react-query";
import { Timestamp } from "firebase/firestore";

export type ApplicationRow = {
  index: number;
  dateSubmitted: Timestamp;
  applicant: {
    name: string;
    id: string;
    email: string;
    previouslyAppliedCount: number;
    internal: boolean;
  };
  responseId: string;
  role: ApplicantRole;
  reviews: {
    assigned: number;
    completed: number;
    averageScore: number;
    individualScores: number[];
    assignments: AppReviewAssignment[];
    reviewData: ApplicationReviewData[];
  };
  reviewers: {
    assigned: ReviewCapableUser[];
  };
  status: InternalApplicationStatus | undefined;
};

export function useRows(applications: ApplicationResponse[], formId: string) {
  return useQuery({
    queryKey: ["all-apps-rows", applications.map((a) => a.id).sort(), formId],
    placeholderData: (prev) => prev,
    queryFn: async () => {
      const form = await getApplicationForm(formId);
      return Promise.all(
        applications.map(async (app, index) => {
          const role = app.rolesApplied[0];

          const [user, reviews, allAssignments] = await Promise.all([
            getApplicantById(app.userId),
            getReviewDataForResponseRole(formId, app.id, role),
            getReviewAssignmentsForApplication(app.id),
          ]);
          const assignments = allAssignments.filter((a) => a.forRole === role);

          const completedReviews = reviews.filter((r) => r.submitted).length;
          const individualScores = reviews
            .filter((r) => r.submitted)
            .map((r) => calculateReviewScore(r, form));
          const avgScore =
            completedReviews === 0
              ? 0
              : individualScores.reduce((acc, v) => acc + v, 0) /
                completedReviews;
          let status: InternalApplicationStatus | undefined;

          try {
            status = await getApplicationStatusForResponseRole(app.id, role);
          } catch (error) {
            console.log(
              `Failed to fetch application status for application ${app.id}-${role}: ${error}`,
            );
            status = undefined;
          }

          const numPreviouslyApplied = await getPreviouslyAppliedCount(
            app.userId,
          );

          const row: ApplicationRow = {
            index: 1 + index,
            dateSubmitted: app.dateSubmitted,
            applicant: {
              id: user.id,
              name: `${user.firstName} ${user.lastName}`,
              email: user.email,
              previouslyAppliedCount: numPreviouslyApplied,
              internal: user.isInternal ?? false,
            },
            responseId: app.id,
            role: role, //These have already been expanded into their separate roles
            reviews: {
              assigned: assignments.length,
              completed: reviews.filter((r) => r.submitted).length,
              assignments: assignments,
              averageScore: avgScore,
              individualScores: individualScores,
              reviewData: reviews,
            },
            reviewers: {
              assigned: await Promise.all(
                assignments.map(
                  async (assignment) =>
                    (await getUserById(
                      assignment.reviewerId,
                    )) as ReviewCapableUser,
                ),
              ),
            },
            status: status,
          };

          return row;
        }),
      );
    },
  });
}

export function flattenRows(
  rows: ApplicationRow[],
  role: ApplicantRole,
): CsvRow[] {
  const filteredRows = rows.filter((row) => row.role === role);

  if (filteredRows.length === 0) return [];

  const sampleReview = filteredRows
    .flatMap((r) => r.reviews.reviewData.filter((rd) => rd.submitted))
    .find((r) => r !== undefined);

  const scoreKeys = sampleReview
    ? Object.keys(sampleReview.applicantScores).sort()
    : [];
  const noteKeys = sampleReview
    ? Object.keys(sampleReview.reviewerNotes).sort()
    : [];

  return filteredRows.map((row) => {
    const flat: CsvRow = {
      Name: row.applicant.name,
      Role: row.role,
      "Average Review Score": row.reviews.averageScore,
    };

    const submittedReviews = row.reviews.reviewData.filter((r) => r.submitted);

    for (let i = 0; i < 2; i++) {
      const review = submittedReviews[i];
      const n = i + 1;

      if (review && row.reviews.individualScores[i] !== undefined) {
        flat[`Review ${n} - Overall Score`] = row.reviews.individualScores[i];
        scoreKeys.forEach((key) => {
          flat[`Review ${n} - ${key}`] = review.applicantScores[key] ?? "";
        });
        noteKeys.forEach((key) => {
          flat[`Review ${n} Notes - ${key}`] = review.reviewerNotes[key] ?? "";
        });
      } else {
        flat[`Review ${n} - Overall Score`] = "";
        scoreKeys.forEach((key) => {
          flat[`Review ${n} - ${key}`] = "";
        });
        noteKeys.forEach((key) => {
          flat[`Review ${n} Notes - ${key}`] = "";
        });
      }
    }

    return flat;
  });
}
