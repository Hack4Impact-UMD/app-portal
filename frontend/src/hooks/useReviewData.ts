import type { ApplicationReviewData } from "@app-portal/shared/types";
import type { ApplicantRole } from "@app-portal/shared/constants";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  getReviewDataById,
  getReviewDataForApplicant,
  getReviewDataForApplicantRole,
  getReviewDataForApplication,
  getReviewDataForForm,
  getReviewDataForReviewer,
  updateReviewData,
} from "@/services/reviewDataService";
import { useAuth } from "./useAuth";
import { throwErrorToast } from "@/components/toasts/ErrorToast";

export function useReviewData(reviewDataId: string) {
  return useQuery<ApplicationReviewData>({
    queryKey: ["review-data", "id", reviewDataId],
    enabled: !!reviewDataId,
    queryFn: () => getReviewDataById(reviewDataId),
  });
}

export function useUpdateReviewData(reviewDataId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (update: Partial<Omit<ApplicationReviewData, "id">>) => {
      await updateReviewData(reviewDataId, update);
    },
    onMutate: async (newData) => {
      await queryClient.cancelQueries({
        queryKey: ["review-data", "id", reviewDataId],
      });
      const previousData = queryClient.getQueryData<ApplicationReviewData>([
        "review-data",
        "id",
        reviewDataId,
      ]);
      queryClient.setQueryData<ApplicationReviewData>(
        ["review-data", "id", reviewDataId],
        (old) => {
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
        },
      );
      return { previousData };
    },
    onError: (_err, _newData, context) => {
      queryClient.setQueryData(
        ["review-data", "id", reviewDataId],
        context?.previousData,
      );
      throwErrorToast("Failed to update review!");
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: ["review-data", "id", reviewDataId],
      });
      queryClient.invalidateQueries({
        queryKey: ["score"],
      });
    },
  });
}

export function useReviewDataForApplicant(formId: string, applicantId: string) {
  return useQuery<ApplicationReviewData[]>({
    queryKey: ["review-data", "applicant", formId, applicantId],
    queryFn: () => {
      return getReviewDataForApplicant(formId, applicantId);
    },
  });
}

export function useReviewDataForReviewer(formId: string, reviewerId: string) {
  return useQuery<ApplicationReviewData[]>({
    queryKey: ["review-data", "reviewer", formId, reviewerId],
    queryFn: () => {
      return getReviewDataForReviewer(formId, reviewerId);
    },
  });
}

export function useReviewDataForApplicantAndRole(
  formId: string,
  applicantId: string,
  role: ApplicantRole,
) {
  return useQuery<ApplicationReviewData[]>({
    queryKey: ["review-data", "applicant", "role", formId, applicantId],
    queryFn: () => {
      return getReviewDataForApplicantRole(formId, applicantId, role);
    },
  });
}

export function useReviewDataForApplication(applicationResponseId: string) {
  return useQuery<ApplicationReviewData[]>({
    queryKey: ["review-data", "application-response", applicationResponseId],
    queryFn: () => {
      return getReviewDataForApplication(applicationResponseId);
    },
  });
}

export function useMyReviews(formId: string) {
  const { user } = useAuth();
  return useQuery<ApplicationReviewData[]>({
    queryKey: ["review-data", "me", formId, user?.id],
    enabled: !!user,
    queryFn: () => getReviewDataForReviewer(formId, user!.id),
  });
}

export function useReviewDataForForm(formId: string) {
  return useQuery<ApplicationReviewData[]>({
    queryKey: ["review-data", "form", formId],
    enabled: !!formId,
    queryFn: () => getReviewDataForForm(formId),
  });
}
