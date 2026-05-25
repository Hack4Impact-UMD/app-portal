import { useQuery } from "@tanstack/react-query";

import {
  getAllApplicants,
  getApplicantById,
} from "@/services/applicantService.ts";
import type { ApplicantUserProfile } from "@/types/types";

export function useApplicants() {
  return useQuery<ApplicantUserProfile[]>({
    queryKey: ["applicants"],
    queryFn: getAllApplicants,
  });
}

export function useApplicant(id: string) {
  return useQuery<ApplicantUserProfile>({
    queryKey: ["applicant", id],
    queryFn: () => getApplicantById(id),
  });
}
