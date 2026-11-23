import type { ApplicantRole } from "@app-portal/shared/constants";
import {
  skipToken,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import { trpc } from "@/config/trpc";

export function useUploadInterviewRubrics() {
  const queryClient = useQueryClient();

  return useMutation(
    trpc.application.uploadInterviewRubrics.mutationOptions({
      onSettled: () => {
        queryClient.invalidateQueries({ queryKey: trpc.rubrics.pathKey() });
      },
    }),
  );
}

export function useInterviewRubricsForForm(formId?: string) {
  return useQuery(
    trpc.rubrics.list.queryOptions(
      formId ? { formId, kind: "interview" } : skipToken,
    ),
  );
}

export function useInterviewRubricsForFormRole(
  formId?: string,
  role?: ApplicantRole,
) {
  return useQuery(
    trpc.rubrics.list.queryOptions(
      formId && role ? { formId, role, kind: "interview" } : skipToken,
    ),
  );
}
