import { queryOptions, useQuery } from "@tanstack/react-query";

import { getApplicantById } from "@/services/applicantService.ts";

const applicantRoot = "applicant" as const;

export const applicantQueries = {
  root: [applicantRoot] as const,
  detail: (id: string) =>
    queryOptions({
      queryKey: [applicantRoot, id] as const,
      queryFn: () => getApplicantById(id),
    }),
};

export function useApplicant(id: string) {
  return useQuery(applicantQueries.detail(id));
}
