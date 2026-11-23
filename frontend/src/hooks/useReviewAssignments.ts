import { queryOptions, skipToken } from "@tanstack/react-query";

import { getReviewAssignments } from "@/services/reviewAssignmentService";

const reviewAssignmentRoot = "review-assignments" as const;

export const reviewAssignmentQueries = {
  root: [reviewAssignmentRoot] as const,
  detail: (formId?: string, reviewerId?: string) =>
    queryOptions({
      queryKey: [
        reviewAssignmentRoot,
        "form",
        formId,
        "reviewer",
        reviewerId,
      ] as const,
      queryFn:
        formId && reviewerId
          ? () => getReviewAssignments(formId, reviewerId)
          : skipToken,
    }),
};
