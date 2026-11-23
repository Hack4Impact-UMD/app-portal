import { queryOptions, skipToken, useQuery } from "@tanstack/react-query";

import { getDecisionConfirmationForResponseRole } from "@/services/decisionConfirmationService";

import { useAuth } from "./useAuth";

const decisionConfirmationRoot = "decision-confirmation" as const;

export const decisionConfirmationQueries = {
  root: [decisionConfirmationRoot] as const,
  byUserResponse: (userId?: string, responseId?: string) =>
    queryOptions({
      queryKey: [
        decisionConfirmationRoot,
        "user",
        userId,
        "response",
        responseId,
      ] as const,
      queryFn:
        userId && responseId
          ? () => getDecisionConfirmationForResponseRole(userId, responseId)
          : skipToken,
    }),
};

export function useDecisionConfirmationForResponse(
  responseId: string | undefined,
) {
  const { user, isLoading, isAuthed } = useAuth();
  return useQuery({
    ...decisionConfirmationQueries.byUserResponse(user?.id, responseId),
    enabled: !isLoading && isAuthed,
  });
}
