import { skipToken, useQuery } from "@tanstack/react-query";

import { trpc } from "@/config/trpc";
import type { ApplicantUserProfile } from "@/types/types";

const asApplicant = (user: unknown) => user as ApplicantUserProfile;

export function useApplicant(id: string) {
  return useQuery(trpc.users.get.queryOptions({ id }, { select: asApplicant }));
}

export function useApplicantForResponse(responseId?: string) {
  return useQuery(
    trpc.users.getApplicantForResponse.queryOptions(
      responseId ? { responseId } : skipToken,
      { select: asApplicant },
    ),
  );
}
