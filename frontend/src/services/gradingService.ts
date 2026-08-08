import { FirestoreCollection } from "@app-portal/shared/constants";
import axios from "axios";
import { doc, getDocs, orderBy, query, where } from "firebase/firestore";

import { API_URL } from "@/config/firebase";
import { appCollection } from "@/services/firestore";
import { getGradingJobMaxScore } from "@/utils/display";

import { getAppCheckToken } from "./appCheckService";

export async function submitGradingJob(
  responseId: string,
  repoURL: string,
  token: string,
): Promise<string> {
  const appCheckToken = await getAppCheckToken();

  const response = await axios.post(
    `${API_URL}/autograder/submit`,
    { responseId, repoURL },
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "X-APPCHECK": appCheckToken,
      },
    },
  );

  return response.data.jobId;
}

export async function submitStandaloneGradingJob(
  repoURL: string,
  testRepo: string,
  token: string,
): Promise<string> {
  const appCheckToken = await getAppCheckToken();

  const response = await axios.post(
    `${API_URL}/autograder/submit-standalone`,
    { repoURL, testRepo },
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "X-APPCHECK": appCheckToken,
      },
    },
  );

  return response.data.jobId;
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

export async function getBestScoreForApplicationResponse(
  responseId: string,
): Promise<number | null> {
  const jobs = await getJobsForApplicationResponse(responseId);

  let bestScore: number | null = null;

  jobs.forEach((j) => {
    // Jobs that haven't produced suite results yet have a max score of 0
    const maxScore = getGradingJobMaxScore(j);
    if (maxScore <= 0) return;

    const score = j.score / maxScore;
    if (bestScore === null || bestScore < score) {
      bestScore = score;
    }
  });

  return bestScore;
}
