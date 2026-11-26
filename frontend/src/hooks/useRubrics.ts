import type { ApplicantRole } from "@app-portal/shared/constants";
import {
  skipToken,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import { trpc } from "@/config/trpc";

export function useUploadRubrics() {
  const queryClient = useQueryClient();

  return useMutation(
    trpc.application.uploadRubrics.mutationOptions({
      onSettled: () => {
        queryClient.invalidateQueries({ queryKey: trpc.rubrics.pathKey() });
      },
    }),
  );
}

export function useRubricsForForm(formId?: string) {
  return useQuery(
    trpc.rubrics.list.queryOptions(
      formId ? { formId, kind: "review" } : skipToken,
    ),
  );
}

export function useRubricsForFormRole(formId?: string, role?: ApplicantRole) {
  return useQuery(
    trpc.rubrics.list.queryOptions(
      formId && role ? { formId, role, kind: "review" } : skipToken,
    ),
  );
}

export function useCreateRubricsForForm() {
  const queryClient = useQueryClient();

  return useMutation(
    trpc.rubrics.createForForm.mutationOptions({
      onSettled: () => {
        queryClient.invalidateQueries({ queryKey: trpc.rubrics.pathKey() });
      },
    }),
  );
}

export function useDuplicateRubricsFromForm() {
  const queryClient = useQueryClient();

  return useMutation(
    trpc.rubrics.duplicateFromForm.mutationOptions({
      onSettled: () => {
        queryClient.invalidateQueries({ queryKey: trpc.rubrics.pathKey() });
      },
    }),
  );
}
