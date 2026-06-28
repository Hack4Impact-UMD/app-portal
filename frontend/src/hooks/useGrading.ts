import { useMutation, useQueryClient } from "@tanstack/react-query";
import { onSnapshot } from "firebase/firestore";
import { useMemo, useSyncExternalStore } from "react";

import { gradingJobDoc, submitGradingJob } from "@/services/gradingService";
import type { GradingJobPublic } from "@/types/types";

const gradingJobRoot = "grading-jobs" as const;

type GradingJobSnapshotState = {
  data: GradingJobPublic | null;
  isPending: boolean;
  error: Error | null;
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
      queryClient.invalidateQueries({ queryKey: [gradingJobRoot] });
    },
  });
}

function createGradingJobStore(jobId?: string) {
  let currentSnapshot: GradingJobSnapshotState = {
    data: null,
    isPending: !!jobId,
    error: jobId ? null : new Error("Missing grading job ID"),
  };

  function getSnapshot() {
    return currentSnapshot;
  }

  function subscribe(callback: () => void) {
    if (!jobId) return () => {};

    return onSnapshot(
      gradingJobDoc(jobId),
      (doc) => {
        currentSnapshot = doc.exists()
          ? {
              data: doc.data(),
              isPending: false,
              error: null,
            }
          : {
              data: null,
              isPending: false,
              error: new Error(`Autograder job ${jobId} does not exist.`),
            };

        callback();
      },
      (error) => {
        currentSnapshot = {
          data: null,
          isPending: false,
          error,
        };
        callback();
      },
    );
  }

  return { getSnapshot, subscribe };
}

// Handles real-time updates on the autograder page.
export function useGradingJobSnapshot(jobId?: string) {
  const store = useMemo(() => createGradingJobStore(jobId), [jobId]);

  return useSyncExternalStore(store.subscribe, store.getSnapshot);
}
