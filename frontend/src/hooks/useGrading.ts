import { useMutation, useQueryClient } from "@tanstack/react-query";

import { submitGradingJob } from "@/services/gradingService";

const gradingJobRoot = "grading-jobs" as const;

export const gradingJobQueries = {
  root: [gradingJobRoot] as const,
};

export const useSubmitGradingJob = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      responseId,
      repoURL,
      token,
    }: {
      responseId: string;
      repoURL: string;
      token: string;
    }) => submitGradingJob(responseId, repoURL, token),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: gradingJobQueries.root });
    },
  });
};
