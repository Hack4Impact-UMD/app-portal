import type { FirestoreCollection } from "@app-portal/shared/constants";
import type {
  ApplicationInterviewData,
  ApplicationReviewData,
  AppReviewAssignment,
  DecisionConfirmation,
  InternalApplicationStatus,
  InterviewAssignment,
  RoleReviewRubric,
  GradingJobDataInternal,
} from "@app-portal/shared/types";
import type { CollectionReference } from "firebase/firestore";
import { collection } from "firebase/firestore";

import { db } from "@/config/firebase";
import type {
  ApplicationForm,
  ApplicationResponse,
  GradingJobPublic,
  UserProfile,
} from "@/types/types";

type ClientCollectionData = {
  [FirestoreCollection.Users]: UserProfile;
  [FirestoreCollection.ApplicationForms]: ApplicationForm;
  [FirestoreCollection.ApplicationResponses]: ApplicationResponse;
  [FirestoreCollection.ApplicationStatus]: InternalApplicationStatus;
  [FirestoreCollection.DecisionStatus]: DecisionConfirmation;
  [FirestoreCollection.Rubrics]: RoleReviewRubric;
  [FirestoreCollection.InterviewRubrics]: RoleReviewRubric;
  [FirestoreCollection.ReviewData]: ApplicationReviewData;
  [FirestoreCollection.InterviewData]: ApplicationInterviewData;
  [FirestoreCollection.ReviewAssignments]: AppReviewAssignment;
  [FirestoreCollection.InterviewAssignments]: InterviewAssignment;
  [FirestoreCollection.GradingJobsPublic]: GradingJobPublic;
  [FirestoreCollection.GradingJobsInternal]: GradingJobDataInternal;
};

export function appCollection<C extends keyof ClientCollectionData>(name: C) {
  return collection(db, name) as CollectionReference<ClientCollectionData[C]>;
}
