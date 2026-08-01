import type { GradingJobDataInternal } from "@app-portal/shared/types";
import {
  queryOptions,
  skipToken,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import axios from "axios";
import type { DocumentReference } from "firebase/firestore";
import { onSnapshot } from "firebase/firestore";
import { useMemo, useSyncExternalStore } from "react";

import { throwErrorToast } from "@/components/toasts/ErrorToast";
import { throwWarningToast } from "@/components/toasts/WarningToast";
import {
  getJobsForApplicationResponse,
  gradingJobDoc,
  gradingJobDocInternal,
  recentGradingJobsQuery,
  submitGradingJob,
  submitStandaloneGradingJob,
} from "@/services/gradingService";
import type { GradingJobPublic } from "@/types/types";

const gradingJobRoot = "grading-jobs" as const;

const gradingJobQueries = {
  root: [gradingJobRoot] as const,
  byResponse: (responseId?: string) =>
    queryOptions({
      queryKey: [gradingJobRoot, "response", responseId] as const,
      queryFn: responseId
        ? () => getJobsForApplicationResponse(responseId)
        : skipToken,
    }),
};

export function useJobsForApplicationResponse(responseId?: string) {
  return useQuery(gradingJobQueries.byResponse(responseId));
}

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
    onError: (error) => {
      if (axios.isAxiosError(error) && error.response?.status === 429) {
        throwWarningToast(
          typeof error.response.data === "string"
            ? error.response.data
            : "Too many grading jobs submitted for this application. Please try again later.",
        );
        return;
      }
      throwErrorToast("Failed to submit grading job: " + error.message);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: [gradingJobRoot] });
    },
  });
}

export function useSubmitStandaloneGradingJob() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      repoURL,
      testRepo,
      token,
    }: {
      repoURL: string;
      testRepo: string;
      token: string;
    }) => submitStandaloneGradingJob(repoURL, testRepo, token),
    onError: (error) => {
      throwErrorToast(
        "Failed to submit standalone grading job: " + error.message,
      );
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: [gradingJobRoot] });
    },
  });
}

function createGradingJobStore<T extends GradingJobSnapshotData>(
  getDocRef: (jobId: string) => DocumentReference<T>,
  jobId: string | undefined,
  enabled: boolean,
  onData?: (data: T) => void,
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

        if (doc.exists()) {
          onData?.(doc.data());
        }

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
  const queryClient = useQueryClient();

  const store = useMemo(
    () =>
      createGradingJobStore(gradingJobDoc, jobId, !!jobId, (job) => {
        // Jobs are graded asynchronously with no push notification to the
        // frontend when grading finishes, so re-fetch the jobs-for-response
        // list on every update to this job to keep "best score" in sync.
        queryClient.invalidateQueries({
          queryKey: [gradingJobRoot, "response", job.responseId],
        });
      }),
    [jobId, queryClient],
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

type RecentGradingJobsState = {
  data: GradingJobPublic[] | null;
  isPending: boolean;
  error: Error | null;
};

function createRecentGradingJobsStore() {
  let currentSnapshot: RecentGradingJobsState = {
    data: null,
    isPending: true,
    error: null,
  };

  function getSnapshot() {
    return currentSnapshot;
  }

  function subscribe(callback: () => void) {
    return onSnapshot(
      recentGradingJobsQuery(),
      (snapshot) => {
        currentSnapshot = {
          data: snapshot.docs.map((doc) => doc.data()),
          isPending: false,
          error: null,
        };
        callback();
      },
      (error) => {
        currentSnapshot = { data: null, isPending: false, error };
        callback();
      },
    );
  }

  return { getSnapshot, subscribe };
}

// Live-updating list of the most recent grading jobs across all responses,
// backed by a Firestore query subscription.
export function useRecentGradingJobs() {
  const store = useMemo(() => createRecentGradingJobsStore(), []);

  return useSyncExternalStore(store.subscribe, store.getSnapshot);
}
