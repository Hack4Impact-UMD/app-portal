import type { ApplicantRole } from "@app-portal/shared/constants";
import { queryOptions, skipToken, useQuery } from "@tanstack/react-query";

import { getApplicationStatus } from "@/services/statusService";

const applicationStatusRoot = "status" as const;

export const applicationStatusQueries = {
  root: [applicationStatusRoot] as const,
  mine: (responseId?: string, role?: ApplicantRole) =>
    queryOptions({
      queryKey: [applicationStatusRoot, responseId, role] as const,
      queryFn:
        responseId && role
          ? () => getApplicationStatus(responseId, role)
          : skipToken,
    }),
};

export function useMyApplicationStatus(
  responseId?: string,
  role?: ApplicantRole,
) {
  return useQuery(applicationStatusQueries.mine(responseId, role));
}
