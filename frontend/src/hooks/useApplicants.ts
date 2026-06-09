import { queryOptions, skipToken, useQuery } from "@tanstack/react-query";

import {
  getApplicantById,
  getApplicantForResponse,
} from "@/services/applicantService.ts";

import { userQueries } from "./useUsers";

const applicantRoot = [...userQueries.root, "applicant"] as const;

const applicantQueries = {
  root: applicantRoot,
  detail: (id: string) =>
    queryOptions({
      queryKey: [...applicantRoot, id] as const,
      queryFn: () => getApplicantById(id),
    }),
  byResponse: (responseId?: string) =>
    queryOptions({
      queryKey: [...applicantRoot, "response", responseId] as const,
      queryFn: responseId
        ? () => getApplicantForResponse(responseId)
        : skipToken,
    }),
};

export function useApplicant(id: string) {
  return useQuery(applicantQueries.detail(id));
}

export function useApplicantForResponse(responseId?: string) {
  return useQuery(applicantQueries.byResponse(responseId));
}
