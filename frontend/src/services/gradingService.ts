import { FirestoreCollection } from "@app-portal/shared/constants";
import axios from "axios";
import { doc, getDoc } from "firebase/firestore";

import { API_URL } from "@/config/firebase";
import { appCollection } from "@/services/firestore";
import type { GradingJobPublic } from "@/types/types";

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

export function gradingJobDoc(id: string) {
  return doc(appCollection(FirestoreCollection.GradingJobsPublic), id);
}

export function gradingJobDocInternal(id: string) {
  return doc(appCollection(FirestoreCollection.GradingJobsInternal), id);
}

export async function getGradingJobById(id: string) {
  const docRef = gradingJobDoc(id);
  const snapshot = await getDoc(docRef);
  return snapshot.exists() ? (snapshot.data() as GradingJobPublic) : null;
}
