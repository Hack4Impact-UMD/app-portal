import type { ApplicantRole } from "@app-portal/shared/constants";
import {
  FirestoreCollection,
  ReviewStatus,
} from "@app-portal/shared/constants";
import type { InternalApplicationStatus } from "@app-portal/shared/types";
import {
  doc,
  getDocs,
  query,
  updateDoc,
  where,
  writeBatch,
} from "firebase/firestore";

import { db } from "@/config/firebase";
import { trpcClient } from "@/config/trpc";

import { appCollection } from "./firestore";

export async function getApplicationStatus(
  responseId: string,
  role: ApplicantRole,
) {
  return trpcClient.status.get.query({ responseId, role });
}

export async function getAllApplicationStatusesForForm(formId: string) {
  const statusCollection = appCollection(FirestoreCollection.ApplicationStatus);
  const q = query(statusCollection, where("formId", "==", formId));
  const docsSnap = await getDocs(q);
  return docsSnap.docs.map((d) => d.data());
}

export async function rejectUndecidedApplicantsForForm(formId: string) {
  const statuses = await getAllApplicationStatusesForForm(formId);
  const undecided = statuses.filter((s) => !isDecided(s.status));
  const statusCollection = appCollection(FirestoreCollection.ApplicationStatus);

  const chunkSize = 250;

  for (let i = 0; i < undecided.length; i += chunkSize) {
    const chunk = undecided.slice(i, i + chunkSize);
    const batch = writeBatch(db);

    chunk.forEach((s) => {
      const update: Partial<InternalApplicationStatus> = {
        status: ReviewStatus.Denied,
      };

      batch.update(doc(statusCollection, s.id), update);
    });

    await batch.commit();
  }
}

export function isDecided(status: ReviewStatus) {
  return [
    ReviewStatus.Accepted,
    ReviewStatus.Denied,
    ReviewStatus.Waitlisted,
  ].includes(status);
}

export async function updateApplicationStatus(
  statusId: string,
  update: Partial<Omit<InternalApplicationStatus, "id">>,
) {
  const statusCollection = appCollection(FirestoreCollection.ApplicationStatus);
  const statusDoc = doc(statusCollection, statusId);
  await updateDoc(statusDoc, update);
}

// Helper to fetch all qualified statuses for a form
