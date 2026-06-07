import type { ApplicantRole } from "@app-portal/shared/constants";
import { queryOptions, skipToken, useQuery } from "@tanstack/react-query";

import { getApplicationStatus } from "@/services/statusService";

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
};

export function useMyApplicationStatus(
  responseId?: string,
  role?: ApplicantRole,
) {
  const { token } = useAuth();
  return useQuery(applicationStatusQueries.mine(token, responseId, role));
}
