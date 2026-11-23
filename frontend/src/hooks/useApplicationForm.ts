import {
  useQuery,
  useMutation,
  useQueryClient,
  skipToken,
} from "@tanstack/react-query";

import { trpc } from "@/config/trpc";
import {
  createApplicationForm,
  setApplicationFormDueDate,
  setApplicationFormInvitedUsers,
} from "@/services/applicationFormsService";
import type { ApplicationForm } from "@/types/types";

import { useAuth } from "./useAuth";

export class NoActiveFormError extends Error {
  constructor() {
    super("No active form!");
    this.name = "NoActiveFormError";
  }
}

export function useAllApplicationForms() {
  return useQuery(trpc.forms.list.queryOptions());
}

export function useApplicationForm(formId?: string, refetch = true) {
  return useQuery({
    ...trpc.forms.get.queryOptions(formId ? { id: formId } : skipToken),
    refetchOnWindowFocus: refetch,
  });
}

export function useActiveForm() {
  return useQuery(
    trpc.forms.active.queryOptions(undefined, {
      select: (form) => {
        if (!form) throw new NoActiveFormError();
        return form;
      },
    }),
  );
}

export const useUploadApplicationForm = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      form,
      createOnly,
    }: {
      form: ApplicationForm;
      createOnly?: boolean;
    }) => createApplicationForm(form, { createOnly }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: trpc.forms.list.queryKey() });
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
    }: {
      originalForm: ApplicationForm;
      newFormId: string;
      newFormSemester: string;
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
      return await createApplicationForm(newForm, { createOnly: true });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: trpc.forms.pathKey() });
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
      queryClient.invalidateQueries({ queryKey: trpc.forms.pathKey() });
    },
  });
}

export function useApplicationFormForResponseId(responseId?: string) {
  return useQuery(
    trpc.forms.getForResponse.queryOptions(
      responseId ? { responseId } : skipToken,
    ),
  );
}

export function useInvitedForms() {
  const { isAuthed, isLoading } = useAuth();

  return useQuery({
    ...trpc.forms.invited.queryOptions(),
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
      queryClient.invalidateQueries({ queryKey: trpc.forms.pathKey() });
    },
  });
}
