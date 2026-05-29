import axios from "axios";

import { API_URL } from "@/config/firebase";

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
