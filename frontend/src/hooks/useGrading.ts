import {
  useMutation,
  useQuery,
  useQueryClient,
  skipToken,
  queryOptions,
} from "@tanstack/react-query";
import { onSnapshot } from "firebase/firestore";
import type { FirestoreError } from "firebase/firestore";
import { useEffect, useState } from "react";

import {
  getGradingJobById,
  gradingJobDoc,
  submitGradingJob,
} from "@/services/gradingService";

const gradingJobRoot = "grading-jobs" as const;

const gradingJobQueries = {
  root: [gradingJobRoot] as const,
  snapshot: (jobId?: string) =>
    queryOptions({
      queryKey: [gradingJobRoot, jobId] as const,
      queryFn: jobId ? () => getGradingJobById(jobId) : skipToken,
      staleTime: Infinity,
      refetchOnWindowFocus: false,
    }),
};

export function useSubmitGradingJob() {
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
}

// handles real-time updates on the autograder page
// fetches intiial job with Query, uses Firestore onSnapshot for updates
export function useGradingJobSnapshot(jobId?: string) {
  const queryClient = useQueryClient();
  const [listenerError, setListenerError] = useState<
    FirestoreError | undefined
  >();

  const query = useQuery(gradingJobQueries.snapshot(jobId));

  useEffect(() => {
    setListenerError(undefined);

    if (!jobId) {
      return;
    }

    return onSnapshot(
      gradingJobDoc(jobId),
      (snapshot) => {
        queryClient.setQueryData(
          gradingJobQueries.snapshot(jobId).queryKey,
          () => (snapshot.exists() ? snapshot.data() : null),
        );
      },
      (err) => {
        setListenerError(err);
      },
    );
  }, [jobId, queryClient]);

  const error = listenerError ?? query.error;

  return {
    data: query.data,
    isPending: query.isPending,
    error,
    notFound: query.data === null,
  };
}
