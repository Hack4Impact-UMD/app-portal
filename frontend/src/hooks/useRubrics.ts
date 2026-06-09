import type { ApplicantRole } from "@app-portal/shared/constants";
import type { RoleReviewRubric } from "@app-portal/shared/types";
import {
  queryOptions,
  skipToken,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import {
  getRoleRubricsForForm,
  getRoleRubricsForFormRole,
  uploadRubrics,
} from "@/services/rubricService";

const rubricRoot = "rubrics" as const;

const rubricQueries = {
  root: [rubricRoot] as const,
  byForm: (formId?: string) =>
    queryOptions({
      queryKey: [rubricRoot, "form", formId] as const,
      queryFn: formId ? () => getRoleRubricsForForm(formId) : skipToken,
    }),
  byFormRole: (formId?: string, role?: ApplicantRole) =>
    queryOptions({
      queryKey: [rubricRoot, "form", formId, "role", role] as const,
      queryFn:
        formId && role
          ? () => getRoleRubricsForFormRole(formId, role)
          : skipToken,
    }),
};

export const useUploadRubrics = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      rubrics,
      token,
    }: {
      rubrics: RoleReviewRubric[];
      token: string;
    }) => uploadRubrics(rubrics, token),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: rubricQueries.root });
    },
  });
};

export function useRubricsForForm(formId?: string) {
  return useQuery(rubricQueries.byForm(formId));
}

export function useRubricsForFormRole(formId?: string, role?: ApplicantRole) {
  return useQuery(rubricQueries.byFormRole(formId, role));
}
