import {
  useQuery,
  useMutation,
  useQueryClient,
  skipToken,
} from "@tanstack/react-query";

import { throwErrorToast } from "@/components/toasts/ErrorToast";
import { throwSuccessToast } from "@/components/toasts/SuccessToast";
import { isTRPCClientError, trpc, trpcClient } from "@/config/trpc";
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

export function isFormIdTakenError(error: unknown) {
  return isTRPCClientError(error) && error.data?.code === "CONFLICT";
}

export function useUploadApplicationForm() {
  const queryClient = useQueryClient();
  return useMutation(
    trpc.application.createForm.mutationOptions({
      onSettled: () => {
        queryClient.invalidateQueries({ queryKey: trpc.forms.pathKey() });
      },
    }),
  );
}

export function useDuplicateForm() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      originalForm,
      newFormId,
      newFormSemester,
    }: {
      originalForm: ApplicationForm;
      newFormId: string;
      newFormSemester: string;
    }) =>
      trpcClient.application.createForm.mutate({
        form: {
          ...originalForm,
          id: newFormId,
          semester: newFormSemester,
          isActive: false,
          decisionsReleased: false,
        },
        createOnly: true,
      }),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: trpc.forms.pathKey() });
    },
  });
}

export function useUpdateApplicationFormDueDate() {
  const queryClient = useQueryClient();
  return useMutation(
    trpc.forms.setDueDate.mutationOptions({
      onSettled: () => {
        queryClient.invalidateQueries({ queryKey: trpc.forms.pathKey() });
      },
    }),
  );
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
  return useMutation(
    trpc.forms.setInvitedUsers.mutationOptions({
      onSettled: () => {
        queryClient.invalidateQueries({ queryKey: trpc.forms.pathKey() });
      },
    }),
  );
}

export function useUpdateApplicationFormActive() {
  const queryClient = useQueryClient();
  return useMutation(
    trpc.forms.setActive.mutationOptions({
      onError: (err) => {
        throwErrorToast("Failed to update form active status");
        console.error(err);
      },
      onSuccess: () => {
        throwSuccessToast("Form active status updated successfully!");
      },
      onSettled: async () => {
        await queryClient.invalidateQueries({
          queryKey: trpc.forms.pathKey(),
        });
      },
    }),
  );
}
