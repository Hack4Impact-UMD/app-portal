import { FirestoreCollection } from "@app-portal/shared/constants";
import { doc, orderBy, query } from "firebase/firestore";

import { appCollection } from "@/services/firestore";

// Firestore query for the most recent grading jobs across all responses,
// ordered newest-first. Single-field orderBy is auto-indexed.
export function recentGradingJobsQuery() {
  return query(
    appCollection(FirestoreCollection.GradingJobsPublic),
    orderBy("started", "desc"),
  );
}

export function gradingJobDoc(id: string) {
  return doc(appCollection(FirestoreCollection.GradingJobsPublic), id);
}

export function gradingJobDocInternal(id: string) {
  return doc(appCollection(FirestoreCollection.GradingJobsInternal), id);
}
