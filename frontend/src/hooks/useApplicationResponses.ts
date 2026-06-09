import { queryOptions, skipToken, useQuery } from "@tanstack/react-query";

import {
  fetchMyApplicationResponseAndForm,
  getAllApplicationResponsesByFormId,
  getApplicationResponseById,
  getApplicationResponses,
} from "@/services/applicationResponsesService";

import { useAuth } from "./useAuth";

const applicationResponseRoot = "responses" as const;

export const applicationResponseQueries = {
  root: [applicationResponseRoot] as const,
  byUser: (userId?: string) =>
    queryOptions({
      queryKey: [applicationResponseRoot, "user", userId] as const,
      queryFn: userId ? () => getApplicationResponses(userId) : skipToken,
    }),
  byUserForm: (userId?: string, formId?: string) =>
    queryOptions({
      queryKey: [
        applicationResponseRoot,
        "user",
        userId,
        "form",
        formId,
      ] as const,
      queryFn:
        userId && formId
          ? async () => fetchMyApplicationResponseAndForm(userId, formId)
          : skipToken,
    }),
  byForm: (formId?: string) =>
    queryOptions({
      queryKey: [applicationResponseRoot, "form", formId] as const,
      queryFn: formId
        ? () => getAllApplicationResponsesByFormId(formId)
        : skipToken,
    }),
  detail: (responseId?: string) =>
    queryOptions({
      queryKey: [applicationResponseRoot, "response", responseId] as const,
      queryFn: responseId
        ? () => getApplicationResponseById(responseId)
        : skipToken,
    }),
};

export function useMyApplicationResponses() {
  const { user, isAuthed, isLoading } = useAuth();

  return useQuery({
    ...applicationResponseQueries.byUser(user?.id),
    enabled: !isLoading && isAuthed,
    initialData: [],
  });
}
export function useMyApplicationResponseAndForm(formId?: string) {
  const { user, isLoading, isAuthed } = useAuth();

  return useQuery({
    ...applicationResponseQueries.byUserForm(user?.id, formId),
    enabled: !isLoading && isAuthed,
  });
}

// includes in-progress submissions
export function useAllApplicationResponsesForForm(formId: string | undefined) {
  return useQuery(applicationResponseQueries.byForm(formId));
}

export function useApplicationResponse(responseId?: string) {
  return useQuery(applicationResponseQueries.detail(responseId));
}
