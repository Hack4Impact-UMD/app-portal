import type { ApplicantRole } from "@app-portal/shared/constants";
import { useQuery } from "@tanstack/react-query";

import { trpc } from "@/config/trpc";
import type { ReviewCapableUser } from "@/types/types";

const asReviewers = (users: unknown) => users as ReviewCapableUser[];

export function useAllReviewers() {
  return useQuery(
    trpc.users.listReviewers.queryOptions({}, { select: asReviewers }),
  );
}

export function useReviewersForRole(role: ApplicantRole) {
  return useQuery(
    trpc.users.listReviewers.queryOptions({ role }, { select: asReviewers }),
  );
}
