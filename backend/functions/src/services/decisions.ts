import { FirestoreCollection } from "@app-portal/shared/constants";
import type { DecisionConfirmation } from "@app-portal/shared/types";

import { appCollection } from "../utils/firestore";

const decisions = () => appCollection(FirestoreCollection.DecisionStatus);

export async function listConfirmationsForForm(formId: string) {
  return (await decisions().where("formId", "==", formId).get()).docs.map((d) =>
    d.data(),
  );
}

export async function getConfirmation(uid: string, responseId: string) {
  return (
    await decisions()
      .where("userId", "==", uid)
      .where("responseId", "==", responseId)
      .limit(1)
      .get()
  ).docs[0]?.data();
}

export async function responseHasConfirmation(responseId: string) {
  return !(
    await decisions().where("responseId", "==", responseId).limit(1).get()
  ).empty;
}

export async function setConfirmation(confirmation: DecisionConfirmation) {
  await decisions()
    .doc(`${confirmation.responseId}_${confirmation.userId}`)
    .set(confirmation);
}
