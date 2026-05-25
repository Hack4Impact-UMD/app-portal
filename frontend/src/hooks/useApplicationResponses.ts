import { useQuery } from "@tanstack/react-query";

import { getApplicationForm } from "@/services/applicationFormsService";
import {
  fetchOrCreateApplicationResponse,
  getAllApplicationResponsesByFormId,
  getApplicationResponseById,
  getApplicationResponses,
  getAssignedApplicationResponsesByFormId,
} from "@/services/applicationResponsesService";
import { reviewCapable } from "@/services/reviewersService";
import type { ApplicationForm, ApplicationResponse } from "@/types/types";

import { useAuth } from "./useAuth";

//gets the current user's application responses
export function useMyApplicationResponses() {
  const { user, isAuthed, isLoading } = useAuth();

  return useQuery<ApplicationResponse[]>({
    queryKey: ["responses", "user", user?.id],
    enabled: !isLoading && isAuthed,
    queryFn: () => {
      return getApplicationResponses(user!.id);
    },
    initialData: [],
  });
}

//gets the current user's application response for the form and the form itself
export function useMyApplicationResponseAndForm(formId?: string) {
  const { user, isAuthed, isLoading } = useAuth();

  return useQuery<{ form: ApplicationForm; response: ApplicationResponse }>({
    queryKey: ["responses", "user", user?.id, formId],
    enabled: !isLoading && isAuthed && formId !== undefined,
    queryFn: async () => {
      const form = await getApplicationForm(formId!);
      console.log(`form found: ${form.semester}`);
      const response = await fetchOrCreateApplicationResponse(user!.id, form);
      console.log(`got response: ${response.id}`);
      return {
        form: form,
        response: response,
      };
    },
  });
}

//gets all application responses for a given form, includes in-progress submissions
export function useAllApplicationResponsesForForm(formId: string | undefined) {
  return useQuery<ApplicationResponse[]>({
    queryKey: ["responses", "form", formId],
    enabled: !!formId,
    queryFn: () => {
      if (!formId) throw new Error("formId is required");
      return getAllApplicationResponsesByFormId(formId);
    },
  });
}

//gets all application responses for a given form assigned to the current reviewer
export function useAssignedApplicationResponsesForForm(formId: string) {
  const { user, isAuthed, isLoading } = useAuth();

  return useQuery<ApplicationResponse[]>({
    queryKey: ["responses", "assigned", user?.id, formId],
    enabled: !isLoading && isAuthed && formId !== undefined,
    queryFn: async () => {
      if (!user || !reviewCapable(user))
        throw new Error(
          "Assigned application data is only available to reviewers!",
        );
      return getAssignedApplicationResponsesByFormId(formId, user.id);
    },
  });
}

export function useApplicationResponse(responseId?: string) {
  return useQuery<ApplicationResponse | undefined>({
    queryKey: ["responses", "response", responseId],
    enabled: !!responseId,
    queryFn: () => {
      return getApplicationResponseById(responseId!);
    },
  });
}
