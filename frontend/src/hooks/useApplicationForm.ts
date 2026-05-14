import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ApplicationForm } from "../types/types";
import {
  getActiveForm,
  getAllForms,
  getApplicationForm,
  getApplicationFormForResponseId,
  createApplicationForm,
  setApplicationFormDueDate,
} from "../services/applicationFormsService";

export function useAllApplicationForms() {
  return useQuery<ApplicationForm[]>({
    queryKey: ["form", "all"],
    queryFn: () => getAllForms(),
  });
}

export function useApplicationForm(formId?: string, refetch: boolean = true) {
  return useQuery<ApplicationForm>({
    queryKey: ["form", formId],
    queryFn: () => getApplicationForm(formId!),
    enabled: formId != null,
    refetchOnWindowFocus: refetch,
  });
}

export function useActiveForm() {
  return useQuery<ApplicationForm>({
    queryKey: ["form", "active"],
    queryFn: getActiveForm,
  });
}

export const useUploadApplicationForm = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ form, token }: { form: ApplicationForm; token: string }) =>
      createApplicationForm(form, token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["form", "all"] });
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
      queryClient.invalidateQueries({ queryKey: ["form"] });
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
      queryClient.invalidateQueries({ queryKey: ["form"] });
    },
  });
}

export function useApplicationFormForResponseId(responseId?: string) {
  return useQuery<ApplicationForm>({
    queryKey: ["form", "responseId", responseId],
    queryFn: () => getApplicationFormForResponseId(responseId!),
    enabled: responseId != null,
  });
}
