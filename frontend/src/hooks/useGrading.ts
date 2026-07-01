import type { GradingJobDataInternal } from "@app-portal/shared/types";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { DocumentReference } from "firebase/firestore";
import { onSnapshot } from "firebase/firestore";
import { useMemo, useSyncExternalStore } from "react";

import {
  gradingJobDoc,
  gradingJobDocInternal,
  submitGradingJob,
} from "@/services/gradingService";
import type { GradingJobPublic } from "@/types/types";

const gradingJobRoot = "grading-jobs" as const;

type GradingJobSnapshotData = GradingJobPublic | GradingJobDataInternal;

type GradingJobSnapshotState<T extends GradingJobSnapshotData> = {
  data: T | null;
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

function createGradingJobStore<T extends GradingJobSnapshotData>(
  getDocRef: (jobId: string) => DocumentReference<T>,
  jobId: string | undefined,
  enabled: boolean,
) {
  let currentSnapshot: GradingJobSnapshotState<T> = {
    data: null,
    isPending: !!jobId && enabled,
    error: !jobId && enabled ? new Error("Missing grading job ID") : null,
  };

  function getSnapshot() {
    return currentSnapshot;
  }

  function subscribe(callback: () => void) {
    if (!jobId || !enabled) return () => {};

    return onSnapshot(
      getDocRef(jobId),
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

export function useGradingJobSnapshot(jobId?: string) {
  const store = useMemo(
    () => createGradingJobStore(gradingJobDoc, jobId, true),
    [jobId],
  );

  return useSyncExternalStore(store.subscribe, store.getSnapshot);
}

export function useGradingJobInternalSnapshot(
  jobId: string | undefined,
  enabled: boolean,
) {
  const store = useMemo(
    () => createGradingJobStore(gradingJobDocInternal, jobId, enabled),
    [enabled, jobId],
  );

  return useSyncExternalStore(store.subscribe, store.getSnapshot);
}
