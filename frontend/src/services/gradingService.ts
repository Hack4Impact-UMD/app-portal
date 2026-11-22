import { FirestoreCollection } from "@app-portal/shared/constants";
import { doc, getDocs, orderBy, query, where } from "firebase/firestore";

import { trpcClient } from "@/config/trpc";
import { appCollection } from "@/services/firestore";

export async function submitGradingJob(
  responseId: string,
  repoURL: string,
): Promise<string> {
  const { jobId } = await trpcClient.grading.submit.mutate({
    responseId,
    repoURL,
  });
  return jobId;
}

export async function submitStandaloneGradingJob(
  repoURL: string,
  testRepo: string,
): Promise<string> {
  const { jobId } = await trpcClient.grading.submitStandalone.mutate({
    repoURL,
    testRepo,
  });
  return jobId;
}

// Firestore query for the most recent grading jobs across all responses,
// ordered newest-first. Single-field orderBy is auto-indexed.
export function recentGradingJobsQuery() {
  return query(
    appCollection(FirestoreCollection.GradingJobsPublic),
    orderBy("started", "desc"),
  );
}

export function gradingJobDoc(id: string) {
  return doc(appCollection(FirestoreCollection.GradingJobsPublic), id);
}

export function gradingJobDocInternal(id: string) {
  return doc(appCollection(FirestoreCollection.GradingJobsInternal), id);
}

export async function getJobsForApplicationResponse(responseId: string) {
  const jobs = appCollection(FirestoreCollection.GradingJobsPublic);
  const q = query(
    jobs,
    where("responseId", "==", responseId),
    orderBy("started", "desc"),
  );

  const snap = await getDocs(q);

  return snap.docs.map((d) => d.data());
}
