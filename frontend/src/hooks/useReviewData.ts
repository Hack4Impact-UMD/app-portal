import type { ApplicationReviewData } from "@app-portal/shared/types";
import {
  skipToken,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import { throwErrorToast } from "@/components/toasts/ErrorToast";
import { trpc, trpcClient } from "@/config/trpc";

type ReviewDataPatch = Partial<
  Pick<ApplicationReviewData, "applicantScores" | "reviewerNotes" | "submitted">
>;

export function useReviewData(reviewDataId?: string) {
  return useQuery(
    trpc.reviewData.get.queryOptions(
      reviewDataId ? { id: reviewDataId } : skipToken,
    ),
  );
}

export function useUpdateReviewData(reviewDataId: string) {
  const queryClient = useQueryClient();
  const queryKey = trpc.reviewData.get.queryKey({ id: reviewDataId });

  return useMutation({
    mutationFn: (patch: ReviewDataPatch) =>
      trpcClient.reviewData.update.mutate({ id: reviewDataId, patch }),
    onMutate: async (newData) => {
      await queryClient.cancelQueries({ queryKey });
      const previousData = queryClient.getQueryData(queryKey);
      queryClient.setQueryData(queryKey, (old) => {
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
      queryClient.setQueryData(queryKey, context?.previousData);
      throwErrorToast("Failed to update review!");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });
}
