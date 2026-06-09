import type { ApplicationReviewData } from "@app-portal/shared/types";
import {
  queryOptions,
  skipToken,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import { throwErrorToast } from "@/components/toasts/ErrorToast";
import {
  getReviewDataById,
  getReviewDataForApplication,
  getReviewDataForForm,
  getReviewDataForReviewer,
  updateReviewData,
} from "@/services/reviewDataService";

import { useAuth } from "./useAuth";

const reviewDataRoot = "review-data" as const;

const reviewDataQueries = {
  root: [reviewDataRoot] as const,
  detail: (id?: string) =>
    queryOptions({
      queryKey: [reviewDataRoot, "id", id] as const,
      queryFn: id ? () => getReviewDataById(id) : skipToken,
    }),
  byReviewer: (formId?: string, reviewerId?: string) =>
    queryOptions({
      queryKey: [
        reviewDataRoot,
        "reviewer",
        "reviewer-id",
        reviewerId,
        "form",
        formId,
      ] as const,
      queryFn:
        formId && reviewerId
          ? () => getReviewDataForReviewer(formId, reviewerId)
          : skipToken,
    }),
  byApplicationResponse: (applicationResponseId?: string) =>
    queryOptions({
      queryKey: [
        reviewDataRoot,
        "application-response",
        applicationResponseId,
      ] as const,
      queryFn: applicationResponseId
        ? () => getReviewDataForApplication(applicationResponseId)
        : skipToken,
    }),
  mine: (formId?: string, reviewerId?: string) =>
    queryOptions({
      queryKey: [
        reviewDataRoot,
        "me",
        "reviewer",
        reviewerId,
        "form",
        formId,
      ] as const,
      queryFn:
        formId && reviewerId
          ? () => getReviewDataForReviewer(formId, reviewerId)
          : skipToken,
    }),
  byForm: (formId?: string) =>
    queryOptions({
      queryKey: [reviewDataRoot, "form", formId] as const,
      queryFn: formId ? () => getReviewDataForForm(formId) : skipToken,
    }),
};

export function useReviewData(reviewDataId?: string) {
  return useQuery(reviewDataQueries.detail(reviewDataId));
}

export function useUpdateReviewData(reviewDataId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (update: Partial<Omit<ApplicationReviewData, "id">>) => {
      await updateReviewData(reviewDataId, update);
    },
    onMutate: async (newData) => {
      const reviewDataKey = reviewDataQueries.detail(reviewDataId).queryKey;

      await queryClient.cancelQueries({
        queryKey: reviewDataKey,
      });
      const previousData =
        queryClient.getQueryData<ApplicationReviewData>(reviewDataKey);
      queryClient.setQueryData<ApplicationReviewData>(reviewDataKey, (old) => {
        if (!old) return undefined;
        return {
          ...old,
          ...newData,
          applicantScores: {
            ...old.applicantScores,
            ...(newData.applicantScores ?? {}),
          },
          reviewerNotes: {
            ...old.reviewerNotes,
            ...(newData.reviewerNotes ?? {}),
          },
        };
      });
      return { previousData };
    },
    onError: (_err, _newData, context) => {
      queryClient.setQueryData(
        reviewDataQueries.detail(reviewDataId).queryKey,
        context?.previousData,
      );
      throwErrorToast("Failed to update review!");
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: reviewDataQueries.detail(reviewDataId).queryKey,
      });
    },
  });
}

export function useReviewDataForReviewer(formId?: string, reviewerId?: string) {
  return useQuery(reviewDataQueries.byReviewer(formId, reviewerId));
}

export function useReviewDataForApplication(applicationResponseId?: string) {
  return useQuery(
    reviewDataQueries.byApplicationResponse(applicationResponseId),
  );
}

export function useMyReviews(formId: string) {
  const { user } = useAuth();
  return useQuery(reviewDataQueries.mine(formId, user?.id));
}

export function useReviewDataForForm(formId?: string) {
  return useQuery(reviewDataQueries.byForm(formId));
}
