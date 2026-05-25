import { useMutation, useQueryClient } from "@tanstack/react-query";

import { submitGradingJob } from "@/services/gradingService";

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
      // adding this early, ensure this is used when the queries are there
      queryClient.invalidateQueries({ queryKey: ["grading-jobs"] });
    },
  });
};
