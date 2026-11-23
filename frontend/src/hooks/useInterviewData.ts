import type { ApplicationInterviewData } from "@app-portal/shared/types";
import {
  skipToken,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import { throwErrorToast } from "@/components/toasts/ErrorToast";
import { trpc, trpcClient } from "@/config/trpc";

type InterviewDataPatch = Partial<
  Pick<
    ApplicationInterviewData,
    "interviewScores" | "interviewerNotes" | "submitted"
  >
>;

export function useInterviewData(interviewDataId?: string) {
  return useQuery(
    trpc.interviewData.get.queryOptions(
      interviewDataId ? { id: interviewDataId } : skipToken,
    ),
  );
}

export function useUpdateInterviewData(interviewDataId: string) {
  const queryClient = useQueryClient();
  const queryKey = trpc.interviewData.get.queryKey({ id: interviewDataId });

  return useMutation({
    mutationFn: (patch: InterviewDataPatch) =>
      trpcClient.interviewData.update.mutate({ id: interviewDataId, patch }),
    onMutate: async (newData) => {
      await queryClient.cancelQueries({ queryKey });
      const previousData = queryClient.getQueryData(queryKey);
      queryClient.setQueryData(queryKey, (old) =>
        old ? { ...old, ...newData } : undefined,
      );
      return { previousData };
    },
    onError: (_err, _newData, context) => {
      queryClient.setQueryData(queryKey, context?.previousData);
      throwErrorToast("Failed to update interview!");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });
}
