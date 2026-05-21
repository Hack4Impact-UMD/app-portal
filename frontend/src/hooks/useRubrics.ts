import type { ApplicantRole, RoleReviewRubric } from "@app-portal/shared/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getRoleRubricsForForm,
  getRoleRubricsForFormRole,
  uploadRubrics,
} from "@/services/rubricService";

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
      queryClient.invalidateQueries({ queryKey: ["rubrics"] });
    },
  });
};

export function useRubricsForForm(formId?: string) {
  return useQuery({
    queryKey: ["rubrics", "form", formId],
    enabled: !!formId,
    queryFn: () => getRoleRubricsForForm(formId!),
  });
}

export function useRubricsForFormRole(formId?: string, role?: ApplicantRole) {
  return useQuery({
    queryKey: ["rubrics", "form", "role", formId, role],
    enabled: !!formId && !!role,
    queryFn: () => getRoleRubricsForFormRole(formId!, role!),
  });
}
