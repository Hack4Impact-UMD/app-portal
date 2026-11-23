import type { ApplicantRole } from "@app-portal/shared/constants";
import {
  FirestoreCollection,
  ReviewStatus,
} from "@app-portal/shared/constants";
import type { InternalApplicationStatus } from "@app-portal/shared/types";
import type { Transaction, UpdateData } from "firebase-admin/firestore";

import { queryWhereIn } from "../utils/batch";
import { appCollection } from "../utils/firestore";
import { commitInChunks } from "./db";

const statuses = () => appCollection(FirestoreCollection.ApplicationStatus);

export async function getStatus(id: string) {
  return (await statuses().doc(id).get()).data();
}

export function getStatusesByIds(ids: string[]) {
  return queryWhereIn(statuses(), "id", ids);
}

export async function listStatusesForForm(formId: string) {
  return (await statuses().where("formId", "==", formId).get()).docs.map((d) =>
    d.data(),
  );
}

export async function listQualifiedStatusesForForm(formId: string) {
  return (
    await statuses()
      .where("formId", "==", formId)
      .where("isQualified", "==", true)
      .get()
  ).docs.map((d) => d.data());
}

export function listStatusesForResponses(responseIds: string[]) {
  return queryWhereIn(statuses(), "responseId", responseIds);
}

export async function getStatusForResponseRole(
  responseId: string,
  role: ApplicantRole,
) {
  return (
    await statuses()
      .where("role", "==", role)
      .where("responseId", "==", responseId)
      .get()
  ).docs[0]?.data();
}

export function createStatus(
  status: InternalApplicationStatus,
  tx: Transaction,
) {
  tx.set(statuses().doc(status.id), status);
}

export async function updateStatus(
  id: string,
  patch: UpdateData<InternalApplicationStatus>,
) {
  await statuses().doc(id).update(patch);
}

export async function denyStatuses(ids: string[]) {
  await commitInChunks(ids, (batch, id) =>
    batch.update(statuses().doc(id), { status: ReviewStatus.Denied }),
  );
}
