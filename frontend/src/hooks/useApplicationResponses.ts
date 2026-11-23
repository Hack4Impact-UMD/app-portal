import { skipToken, useQuery } from "@tanstack/react-query";

import { trpc } from "@/config/trpc";

import { useAuth } from "./useAuth";

export function useMyApplicationResponses() {
  const { isAuthed, isLoading } = useAuth();

  return useQuery({
    ...trpc.application.mine.queryOptions(),
    enabled: !isLoading && isAuthed,
    initialData: [],
  });
}

export function useMyApplicationResponseAndForm(formId?: string) {
  const { isLoading, isAuthed } = useAuth();

  return useQuery({
    ...trpc.application.getOrCreate.queryOptions(
      formId ? { formId } : skipToken,
    ),
    enabled: !isLoading && isAuthed,
  });
}

export function useApplicationResponse(responseId?: string) {
  return useQuery(
    trpc.application.get.queryOptions(
      responseId ? { id: responseId } : skipToken,
    ),
  );
}
