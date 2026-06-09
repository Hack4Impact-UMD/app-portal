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
  createApplicationForm,
  setApplicationFormDueDate,
} from "@/services/applicationFormsService";
import type { ApplicationForm } from "@/types/types";

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
    mutationFn: ({ form, token }: { form: ApplicationForm; token: string }) =>
      createApplicationForm(form, token),
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
      const existingForms = await getAllForms();
      if (existingForms.some((form) => form.id === newFormId))
        throw new Error("Form ID already exists");

      const newForm: ApplicationForm = {
        ...originalForm,
        id: newFormId,
        semester: newFormSemester,
        isActive: false,
        decisionsReleased: false,
      };

      return await createApplicationForm(newForm, token);
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
