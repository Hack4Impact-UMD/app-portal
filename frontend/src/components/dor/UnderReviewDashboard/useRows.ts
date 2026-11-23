import type { ApplicantRole } from "@app-portal/shared/constants";
import { keepPreviousData, skipToken, useQuery } from "@tanstack/react-query";

import { trpc } from "@/config/trpc";
import type { RouterOutputs } from "@/types/trpc";
import type { CsvRow } from "@/types/types";

export type ApplicationRow = RouterOutputs["rows"]["underReview"][number];

export const underReviewRowsQueryRoot = trpc.rows.underReview.pathKey();

export function underReviewRowsQueryOptions(formId: string) {
  return trpc.rows.underReview.queryOptions(
    { formId },
    { placeholderData: keepPreviousData },
  );
}

export function useRows(formId: string | undefined) {
  return useQuery(
    formId
      ? underReviewRowsQueryOptions(formId)
      : trpc.rows.underReview.queryOptions(skipToken),
  );
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
      "Best Autograder Score": row.bestGradingScore ?? "",
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
