import { FirestoreCollection } from "@app-portal/shared/constants";
import axios from "axios";
import { doc, getDocs, orderBy, query, where } from "firebase/firestore";

import { API_URL } from "@/config/firebase";
import { appCollection } from "@/services/firestore";

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
