import {
  FirestoreCollection,
  GradingJobStatus,
} from "@app-portal/shared/constants";
import type { GradingJobDataInternal } from "@app-portal/shared/types";
import type { Transaction } from "firebase-admin/firestore";
import { Timestamp } from "firebase-admin/firestore";

import { db } from "..";
import type { GradingJobPublic } from "../models/autograder";
import { queryWhereIn } from "../utils/batch";
import { appCollection } from "../utils/firestore";
import { listDocs } from "./db";

const publicJobs = () => appCollection(FirestoreCollection.GradingJobsPublic);
const internalJobs = () =>
  appCollection(FirestoreCollection.GradingJobsInternal);

// Newest first.
export function listJobsForResponse(responseId: string) {
  return listDocs(
    publicJobs()
      .where("responseId", "==", responseId)
      .orderBy("started", "desc"),
  );
}

export async function listJobsForResponseInTx(
  responseId: string,
  tx: Transaction,
) {
  return (
    await tx.get(publicJobs().where("responseId", "==", responseId))
  ).docs.map((d) => d.data());
}

export function listJobsForResponses(responseIds: string[]) {
  return queryWhereIn(publicJobs(), "responseId", responseIds);
}

export function listJobsStartedSince(responseId: string, since: Timestamp) {
  return listDocs(
    publicJobs()
      .where("responseId", "==", responseId)
      .where("started", ">=", since),
  );
}

export function createJob(
  publicJob: GradingJobPublic,
  internalJob: GradingJobDataInternal,
  tx: Transaction,
) {
  tx.set(publicJobs().doc(publicJob.id), publicJob);
  tx.set(internalJobs().doc(internalJob.id), internalJob);
}

export async function markJobFailed(id: string) {
  await publicJobs()
    .doc(id)
    .update({ status: GradingJobStatus.Failed, updated: Timestamp.now() });
}

// Fails jobs not updated since the cutoff; returns the jobs that were failed.
export async function failStaleJobs(cutoff: Timestamp, timeoutMinutes: number) {
  const stale = await publicJobs()
    .where("updated", "<", cutoff)
    .where("status", "not-in", [
      GradingJobStatus.Completed,
      GradingJobStatus.Failed,
    ])
    .orderBy("updated", "desc")
    .get();
  if (stale.empty) return [];

  const batch = db.batch();
  const now = Timestamp.now();
  for (const doc of stale.docs) {
    batch.update(doc.ref, {
      status: GradingJobStatus.Failed,
      error: `Job timed out after ${timeoutMinutes} minutes of inactivity. Last status: ${doc.data().status}`,
      updated: now,
      completed: now,
    });
  }
  await batch.commit();
  return stale.docs.map((d) => d.data());
}
