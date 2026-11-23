import type { ApplicantRole } from "@app-portal/shared/constants";
import { skipToken, useQuery } from "@tanstack/react-query";

import { trpc } from "@/config/trpc";

export function useMyApplicationStatus(
  responseId?: string,
  role?: ApplicantRole,
) {
  return useQuery(
    trpc.status.get.queryOptions(
      responseId && role ? { responseId, role } : skipToken,
    ),
  );
}
