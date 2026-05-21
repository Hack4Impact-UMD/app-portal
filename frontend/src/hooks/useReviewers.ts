import type { ApplicantRole } from "@app-portal/shared/types";
import {
  getAllReviewers,
  getReviewersForRole,
  getRolePreferencesForReviewer,
} from "@/services/reviewersService";

import { useQuery } from "@tanstack/react-query";

export function useAllReviewers() {
  return useQuery({
    queryKey: ["reviewers"],
    queryFn: () => getAllReviewers(),
  });
}

export function useReviewersForRole(role: ApplicantRole) {
  return useQuery({
    queryKey: ["reviewers", "role", role],
    queryFn: () => getReviewersForRole(role),
  });
}

export function useRolePreferencesForReviewer(reviewerId: string) {
  return useQuery({
    queryKey: ["reviewers", "reviewerId", reviewerId],
    queryFn: () => getRolePreferencesForReviewer(reviewerId),
  });
}
