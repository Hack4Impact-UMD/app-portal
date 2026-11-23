import { FirestoreCollection } from "@app-portal/shared/constants";
import { doc, getDoc, getDocs, query, where } from "firebase/firestore";

import { trpcClient } from "@/config/trpc";
import type { ApplicationResponse } from "@/types/types";

import { appCollection } from "./firestore";

export async function saveApplicationResponse(
  response: ApplicationResponse,
): Promise<ApplicationResponse> {
  console.log("saving...");
  return trpcClient.application.save.mutate(response);
}

export async function getApplicationResponseById(
  responseId: string,
): Promise<ApplicationResponse | undefined> {
  const responses = appCollection(FirestoreCollection.ApplicationResponses);
  const respDoc = doc(responses, responseId);
  const response: ApplicationResponse | undefined = (
    await getDoc(respDoc)
  ).data();
  return response;
}

export async function getAllApplicationResponsesByFormId(
  formId: string,
): Promise<ApplicationResponse[]> {
  const responses = appCollection(FirestoreCollection.ApplicationResponses);
  const q = query(responses, where("applicationFormId", "==", formId));

  const results = await getDocs(q);

  return results.docs.map((d) => d.data());
}

export type ApplicationSubmitResponse = {
  status: "success";
  application: ApplicationResponse;
};

export async function submitApplicationResponse(
  response: ApplicationResponse,
): Promise<ApplicationSubmitResponse> {
  return trpcClient.application.submit.mutate(response);
}
