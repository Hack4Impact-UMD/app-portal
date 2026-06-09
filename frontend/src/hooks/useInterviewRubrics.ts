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
  getRoleInterviewRubricsForForm,
  getRoleInterviewRubricsForFormRole,
  uploadInterviewRubrics as uploadInterviewRubricsService,
} from "@/services/interviewRubricService";

const interviewRubricRoot = "interview-rubrics" as const;

const interviewRubricQueries = {
  root: [interviewRubricRoot] as const,
  byForm: (formId?: string) =>
    queryOptions({
      queryKey: [interviewRubricRoot, "form", formId] as const,
      queryFn: formId
        ? () => getRoleInterviewRubricsForForm(formId)
        : skipToken,
    }),
  byFormRole: (formId?: string, role?: ApplicantRole) =>
    queryOptions({
      queryKey: [interviewRubricRoot, "form", formId, "role", role] as const,
      queryFn:
        formId && role
          ? () => getRoleInterviewRubricsForFormRole(formId, role)
          : skipToken,
    }),
};

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
      queryClient.invalidateQueries({ queryKey: interviewRubricQueries.root });
    },
  });
};

export function useInterviewRubricsForForm(formId?: string) {
  return useQuery(interviewRubricQueries.byForm(formId));
}

export function useInterviewRubricsForFormRole(
  formId?: string,
  role?: ApplicantRole,
) {
  return useQuery(interviewRubricQueries.byFormRole(formId, role));
}
