import type { ApplicantRole } from "@app-portal/shared/constants";
import { queryOptions, skipToken, useQuery } from "@tanstack/react-query";

import {
  getApplicationStatus,
  getQualifiedStatusesForForm,
  getQualifiedStatusesForFormRoles,
} from "@/services/statusService";

import { useAuth } from "./useAuth";

const applicationStatusRoot = "status" as const;

export const applicationStatusQueries = {
  root: [applicationStatusRoot] as const,
  mine: (
    getToken: () => Promise<string | undefined>,
    responseId?: string,
    role?: ApplicantRole,
  ) =>
    queryOptions({
      queryKey: [applicationStatusRoot, responseId, role] as const,
      queryFn:
        responseId && role
          ? async () =>
              getApplicationStatus((await getToken()) ?? "", responseId, role)
          : skipToken,
    }),
  qualifiedByForm: (formId?: string) =>
    queryOptions({
      queryKey: [applicationStatusRoot, "qualified", "form", formId] as const,
      queryFn: formId ? () => getQualifiedStatusesForForm(formId) : skipToken,
    }),
  qualifiedByFormRoles: (formId?: string, roles?: ApplicantRole[]) =>
    queryOptions({
      queryKey: [
        applicationStatusRoot,
        "qualified",
        "form",
        formId,
        "roles",
        roles?.slice().sort(),
      ] as const,
      queryFn:
        formId && roles
          ? () => getQualifiedStatusesForFormRoles(formId, roles)
          : skipToken,
    }),
};

export function useMyApplicationStatus(
  responseId?: string,
  role?: ApplicantRole,
) {
  const { token } = useAuth();
  return useQuery(applicationStatusQueries.mine(token, responseId, role));
}

export function useQualifiedStatusesForForm(formId?: string) {
  return useQuery({
    ...applicationStatusQueries.qualifiedByForm(formId),
    refetchOnWindowFocus: true,
  });
}

export function useQualifiedStatusesForFormRoles(
  formId?: string,
  roles?: ApplicantRole[],
) {
  return useQuery({
    ...applicationStatusQueries.qualifiedByFormRoles(formId, roles),
    refetchOnWindowFocus: true,
  });
}
