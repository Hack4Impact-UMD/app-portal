import { queryOptions, skipToken, useQuery } from "@tanstack/react-query";

import {
  getReviewAssignments,
  getReviewAssignmentsForApplication,
  getReviewAssignmentsForForm,
} from "@/services/reviewAssignmentService";

import { useAuth } from "./useAuth";

const reviewAssignmentRoot = "review-assignments" as const;

export const reviewAssignmentQueries = {
  root: [reviewAssignmentRoot] as const,
  detail: (formId?: string, reviewerId?: string) =>
    queryOptions({
      queryKey: [
        reviewAssignmentRoot,
        "form",
        formId,
        "reviewer",
        reviewerId,
      ] as const,
      queryFn:
        formId && reviewerId
          ? () => getReviewAssignments(formId, reviewerId)
          : skipToken,
    }),
  byForm: (formId?: string) =>
    queryOptions({
      queryKey: [reviewAssignmentRoot, "form", formId] as const,
      queryFn: formId ? () => getReviewAssignmentsForForm(formId) : skipToken,
    }),
  mine: (formId: string, reviewerId?: string) =>
    queryOptions({
      queryKey: [
        reviewAssignmentRoot,
        "me",
        "form",
        formId,
        "reviewer",
        reviewerId,
      ] as const,
      queryFn: reviewerId
        ? () => getReviewAssignments(formId, reviewerId)
        : skipToken,
    }),
  byResponse: (responseId?: string) =>
    queryOptions({
      queryKey: [reviewAssignmentRoot, "response", responseId] as const,
      queryFn: responseId
        ? () => getReviewAssignmentsForApplication(responseId)
        : skipToken,
    }),
};

export function useReviewAssignments(formId?: string, reviewerId?: string) {
  return useQuery(reviewAssignmentQueries.detail(formId, reviewerId));
}

export function useReviewAssignmentsForForm(formId?: string) {
  return useQuery(reviewAssignmentQueries.byForm(formId));
}

export function useMyReviewAssignments(formId: string) {
  const { user } = useAuth();

  return useQuery(reviewAssignmentQueries.mine(formId, user?.id));
}

export function useReviewAssignmentsForResponse(responseId?: string) {
  return useQuery(reviewAssignmentQueries.byResponse(responseId));
}
