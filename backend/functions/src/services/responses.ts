import { FirestoreCollection } from "@app-portal/shared/constants";
import type { Transaction, UpdateData } from "firebase-admin/firestore";

import type { ApplicationResponse } from "../models/appResponse";
import { getDocsById, queryWhereIn } from "../utils/batch";
import { appCollection } from "../utils/firestore";

const responses = () => appCollection(FirestoreCollection.ApplicationResponses);

export async function getResponse(id: string, tx?: Transaction) {
  const ref = responses().doc(id);
  return (await (tx ? tx.get(ref) : ref.get())).data();
}

export function getResponses(ids: Iterable<string>) {
  return getDocsById(responses(), ids);
}

export async function listResponsesForUser(uid: string) {
  return (await responses().where("userId", "==", uid).get()).docs.map((d) =>
    d.data(),
  );
}

export function listResponsesForUsers(uids: string[]) {
  return queryWhereIn(responses(), "userId", uids);
}

export async function listResponsesForForm(formId: string) {
  return (
    await responses().where("applicationFormId", "==", formId).get()
  ).docs.map((d) => d.data());
}

export async function formHasResponses(formId: string) {
  return !(
    await responses().where("applicationFormId", "==", formId).limit(1).get()
  ).empty;
}

export async function findUserResponseForForm(
  uid: string,
  formId: string,
  tx?: Transaction,
) {
  const query = responses()
    .where("userId", "==", uid)
    .where("applicationFormId", "==", formId)
    .limit(1);
  return (await (tx ? tx.get(query) : query.get())).docs[0]?.data();
}

export function createResponse(response: ApplicationResponse, tx: Transaction) {
  tx.create(responses().doc(response.id), response);
}

export function setResponse(response: ApplicationResponse, tx: Transaction) {
  tx.set(responses().doc(response.id), response);
}

export function updateResponse(
  id: string,
  patch: UpdateData<ApplicationResponse>,
  tx: Transaction,
) {
  tx.update(responses().doc(id), patch);
}
