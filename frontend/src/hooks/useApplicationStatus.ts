import type { ApplicantRole } from "@app-portal/shared/types";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "./useAuth";
import { getApplicationStatus } from "@/services/statusService";

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
