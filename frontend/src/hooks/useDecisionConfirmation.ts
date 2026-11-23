import { skipToken, useQuery } from "@tanstack/react-query";

import { trpc } from "@/config/trpc";

import { useAuth } from "./useAuth";

export function useDecisionConfirmationForResponse(
  responseId: string | undefined,
) {
  const { isLoading, isAuthed } = useAuth();
  return useQuery({
    ...trpc.status.getConfirmation.queryOptions(
      responseId ? { responseId } : skipToken,
    ),
    enabled: !isLoading && isAuthed,
  });
}
