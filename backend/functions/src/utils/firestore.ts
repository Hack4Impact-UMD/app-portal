import type { FirestoreCollection } from "@app-portal/shared/constants";
import type {
  ApplicationInterviewData,
  ApplicationReviewData,
  AppReviewAssignment,
  DecisionConfirmation,
  InternalApplicationStatus,
  InterviewAssignment,
  RoleReviewRubric,
} from "@app-portal/shared/types";
import type { CollectionReference } from "firebase-admin/firestore";

import { db } from "..";
import type { ApplicationForm } from "../models/appForm";
import type { ApplicationResponse } from "../models/appResponse";
import type { UserProfile } from "../models/user";
import type {
  GradingJobDataInternal,
  GradingJobPublic,
} from "../types/grading";

type ServerCollectionData = {
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

export function appCollection<C extends keyof ServerCollectionData>(name: C) {
  return db.collection(name) as CollectionReference<ServerCollectionData[C]>;
}
