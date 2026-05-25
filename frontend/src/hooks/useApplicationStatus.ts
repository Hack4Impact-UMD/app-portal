import type { ApplicantRole } from "@app-portal/shared/constants";
import { useQuery } from "@tanstack/react-query";

import { getApplicationStatus } from "@/services/statusService";

import { useAuth } from "./useAuth";

export function useMyApplicationStatus(
  responseId?: string,
  role?: ApplicantRole,
) {
  const { token } = useAuth();
  return useQuery({
    queryKey: ["status", responseId, role],
    enabled: !!role && !!responseId,
    queryFn: async () =>
      getApplicationStatus((await token()) ?? "", responseId!, role!),
  });
}
