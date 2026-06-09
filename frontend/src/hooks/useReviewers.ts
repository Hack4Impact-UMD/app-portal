import type { ApplicantRole } from "@app-portal/shared/constants";
import { queryOptions, skipToken, useQuery } from "@tanstack/react-query";

import {
  getAllReviewers,
  getReviewerById,
  getReviewersForRole,
} from "@/services/reviewersService";

import { userQueries } from "./useUsers";

const reviewerRoot = [...userQueries.root, "reviewers"] as const;

export const reviewerQueries = {
  root: reviewerRoot,
  all: queryOptions({
    queryKey: [...reviewerRoot, "all"] as const,
    queryFn: () => getAllReviewers(),
  }),
  detail: (reviewerId?: string) =>
    queryOptions({
      queryKey: [...reviewerRoot, "id", reviewerId] as const,
      queryFn: reviewerId ? () => getReviewerById(reviewerId) : skipToken,
    }),
  byRole: (role: ApplicantRole) =>
    queryOptions({
      queryKey: [...reviewerRoot, "role", role] as const,
      queryFn: () => getReviewersForRole(role),
    }),
};

export function useAllReviewers() {
  return useQuery(reviewerQueries.all);
}

export function useReviewerForId(reviewerId?: string) {
  return useQuery(reviewerQueries.detail(reviewerId));
}

export function useReviewersForRole(role: ApplicantRole) {
  return useQuery(reviewerQueries.byRole(role));
}
