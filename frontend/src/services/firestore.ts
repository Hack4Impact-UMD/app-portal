import type { FirestoreCollection } from "@app-portal/shared/constants";
import type { GradingJobDataInternal } from "@app-portal/shared/types";
import type { CollectionReference } from "firebase/firestore";
import { collection } from "firebase/firestore";

import { db } from "@/config/firebase";
import type { GradingJobPublic } from "@/types/types";

// Only the grading jobs are read directly; everything else goes through tRPC.
type ClientCollectionData = {
  [FirestoreCollection.GradingJobsPublic]: GradingJobPublic;
  [FirestoreCollection.GradingJobsInternal]: GradingJobDataInternal;
};

export function appCollection<C extends keyof ClientCollectionData>(name: C) {
  return collection(db, name) as CollectionReference<ClientCollectionData[C]>;
}
