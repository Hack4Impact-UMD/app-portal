import { useQuery } from "@tanstack/react-query";

import { getApplicantById } from "@/services/applicantService.ts";
import type { ApplicantUserProfile } from "@/types/types";

export function useApplicant(id: string) {
  return useQuery<ApplicantUserProfile>({
    queryKey: ["applicant", id],
    queryFn: () => getApplicantById(id),
  });
}
