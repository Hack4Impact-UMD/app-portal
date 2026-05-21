import type { ApplicantRole } from "@app-portal/shared/constants";
import type { RoleReviewRubric } from "@app-portal/shared/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getRoleInterviewRubricsForForm,
  getRoleInterviewRubricsForFormRole,
  uploadInterviewRubrics as uploadInterviewRubricsService,
} from "@/services/interviewRubricService";

export const useUploadInterviewRubrics = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      interviewRubrics,
      token,
    }: {
      interviewRubrics: RoleReviewRubric[];
      token: string;
    }) => uploadInterviewRubricsService(interviewRubrics, token),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["interview-rubrics"] });
    },
  });
};

export function useInterviewRubricsForForm(formId?: string) {
  return useQuery({
    queryKey: ["interview-rubrics", "form", formId],
    enabled: !!formId,
    queryFn: () => getRoleInterviewRubricsForForm(formId!),
  });
}

export function useInterviewRubricsForFormRole(
  formId?: string,
  role?: ApplicantRole,
) {
  return useQuery({
    queryKey: ["interview-rubrics", "form", "role", formId, role],
    enabled: !!formId && !!role,
    queryFn: () => getRoleInterviewRubricsForFormRole(formId!, role!),
  });
}
