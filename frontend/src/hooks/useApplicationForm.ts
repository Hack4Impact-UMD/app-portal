import {
  useQuery,
  useMutation,
  useQueryClient,
  queryOptions,
  skipToken,
} from "@tanstack/react-query";

import {
  getActiveForm,
  getAllForms,
  getApplicationForm,
  getApplicationFormForResponseId,
  getInvitedFormsForUser,
  createApplicationForm,
  setApplicationFormDueDate,
  setApplicationFormInvitedUsers,
} from "@/services/applicationFormsService";
import type { ApplicationForm } from "@/types/types";

import { useAuth } from "./useAuth";

const formRoot = "form" as const;

export const formQueries = {
  root: [formRoot] as const,
  all: queryOptions({
    queryKey: [formRoot, "all"] as const,
    queryFn: () => getAllForms(),
  }),
  detail: (formId?: string) =>
    queryOptions({
      queryKey: [formRoot, "formId", formId],
      queryFn: formId ? () => getApplicationForm(formId) : skipToken,
    }),
  active: queryOptions({
    queryKey: [formRoot, "active"] as const,
    queryFn: () => getActiveForm(),
  }),
  byResponse: (responseId?: string) =>
    queryOptions({
      queryKey: [formRoot, "responseId", responseId] as const,
      queryFn: responseId
        ? () => getApplicationFormForResponseId(responseId)
        : skipToken,
    }),
  invited: (userId?: string) =>
    queryOptions({
      queryKey: [formRoot, "invited", userId] as const,
      queryFn: userId ? () => getInvitedFormsForUser(userId) : skipToken,
    }),
};

export function useAllApplicationForms() {
  return useQuery(formQueries.all);
}

export function useApplicationForm(formId?: string, refetch = true) {
  return useQuery({
    ...formQueries.detail(formId),
    refetchOnWindowFocus: refetch,
  });
}

export function useActiveForm() {
  return useQuery(formQueries.active);
}

export const useUploadApplicationForm = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      form,
      token,
      createOnly,
    }: {
      form: ApplicationForm;
      token: string;
      createOnly?: boolean;
    }) => createApplicationForm(form, token, { createOnly }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: formQueries.all.queryKey });
    },
  });
};

export const useDuplicateForm = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      originalForm,
      newFormId,
      newFormSemester,
      token,
    }: {
      originalForm: ApplicationForm;
      newFormId: string;
      newFormSemester: string;
      token: string;
    }) => {
      const newForm: ApplicationForm = {
        ...originalForm,
        id: newFormId,
        semester: newFormSemester,
        isActive: false,
        decisionsReleased: false,
      };

      // createOnly makes the backend reject a taken ID, so there's no need to
      // scan every form first (and no window for another admin to claim the
      // ID between that check and this write).
      return await createApplicationForm(newForm, token, { createOnly: true });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: formQueries.root });
    },
  });
};

export function useUpdateApplicationFormDueDate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      formId,
      dueDate,
    }: {
      formId: string;
      dueDate: Date;
    }) => {
      await setApplicationFormDueDate(formId, dueDate);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: formQueries.root });
    },
  });
}

export function useApplicationFormForResponseId(responseId?: string) {
  return useQuery(formQueries.byResponse(responseId));
}

export function useInvitedForms() {
  const { user, isAuthed, isLoading } = useAuth();

  return useQuery({
    ...formQueries.invited(user?.id),
    enabled: !isLoading && isAuthed,
    initialData: [],
  });
}

export function useUpdateFormInvitedUsers() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      formId,
      invitedUsers,
    }: {
      formId: string;
      invitedUsers: string[];
    }) => {
      await setApplicationFormInvitedUsers(formId, invitedUsers);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: formQueries.root });
    },
  });
}
