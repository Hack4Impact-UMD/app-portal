import { skipToken, useQuery } from "@tanstack/react-query";

import { trpc } from "@/config/trpc";

export function useApplicant(id: string) {
  return useQuery(trpc.users.get.queryOptions({ id }));
}

export function useApplicantForResponse(responseId?: string) {
  return useQuery(
    trpc.users.getApplicantForResponse.queryOptions(
      responseId ? { responseId } : skipToken,
    ),
  );
}
