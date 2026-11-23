import type { ApplicantRole } from "@app-portal/shared/constants";
import { useQuery } from "@tanstack/react-query";

import { trpc } from "@/config/trpc";

export function useAllReviewers() {
  return useQuery(trpc.users.listReviewers.queryOptions({}));
}

export function useReviewersForRole(role: ApplicantRole) {
  return useQuery(trpc.users.listReviewers.queryOptions({ role }));
}
