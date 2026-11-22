import { FirestoreCollection } from "@app-portal/shared/constants";
import type { DecisionConfirmation } from "@app-portal/shared/types";
import { getDocs, query, where } from "firebase/firestore";

import { trpcClient } from "@/config/trpc";

import { appCollection } from "./firestore";

export async function createDecisionConfirmation(
  decisionConfirmation: DecisionConfirmation,
) {
  return trpcClient.status.confirmDecision.mutate(decisionConfirmation);
}

export async function getDecisionConfirmationForResponseRole(
  userId: string,
  responseId: string,
) {
  const confirmationCollection = appCollection(
    FirestoreCollection.DecisionStatus,
  );
  const q = query(
    confirmationCollection,
    where("userId", "==", userId),
    where("responseId", "==", responseId),
  );

  const resp = (await getDocs(q)).docs.map((d) => d.data());

  if (resp.length > 0) return resp[0];
  else return null;
}
