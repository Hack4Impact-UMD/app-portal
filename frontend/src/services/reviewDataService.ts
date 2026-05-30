import type { ApplicantRole } from "@app-portal/shared/constants";
import type {
  AppReviewAssignment,
  ApplicationReviewData,
} from "@app-portal/shared/types";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";
import { v4 as uuidv4 } from "uuid";

import { db } from "@/config/firebase";

export const REVIEW_DATA_COLLECTION = "review-data";

export async function getReviewDataById(id: string) {
  const reviewData = collection(db, REVIEW_DATA_COLLECTION);
  const docRef = doc(reviewData, id);

  return (await getDoc(docRef)).data() as ApplicationReviewData;
}

export async function getReviewDataForApplication(
  applicationResponseId: string,
) {
  const reviewData = collection(db, REVIEW_DATA_COLLECTION);
  const q = query(
    reviewData,
    where("applicationResponseId", "==", applicationResponseId),
  );
  const result = await getDocs(q);

  return result.docs.map((doc) => doc.data() as ApplicationReviewData);
}

//NOTE: all of these functions take formId as a parameter since
//it's necessary to specify which form to fetch reviews for. This allows
//the system to easily work over multiple application cycles as review
//data and responses for different forms are differentiated
export async function getReviewDataForApplicant(
  formId: string,
  applicantId: string,
) {
  const reviewData = collection(db, REVIEW_DATA_COLLECTION);
  const q = query(
    reviewData,
    where("applicantId", "==", applicantId),
    where("applicationFormId", "==", formId),
  );
  const result = await getDocs(q);

  return result.docs.map((doc) => doc.data() as ApplicationReviewData);
}

export async function getReviewDataForApplicantRole(
  formId: string,
  applicantId: string,
  role: ApplicantRole,
) {
  const reviewData = collection(db, REVIEW_DATA_COLLECTION);
  const q = query(
    reviewData,
    where("applicantId", "==", applicantId),
    where("forRole", "==", role),
    where("applicationFormId", "==", formId),
  );
  const result = await getDocs(q);

  return result.docs.map((doc) => doc.data() as ApplicationReviewData);
}

export async function getReviewDataForAssignment(
  assignment: AppReviewAssignment,
) {
  const reviewData = collection(db, REVIEW_DATA_COLLECTION);
  const q = query(
    reviewData,
    where("applicantId", "==", assignment.applicantId),
    where("forRole", "==", assignment.forRole),
    where("applicationFormId", "==", assignment.formId),
    where("reviewerId", "==", assignment.reviewerId),
  );
  const result = await getDocs(q);

  if (result.docs.length < 1) return undefined;

  return result.docs[0].data() as ApplicationReviewData;
}

export async function createReviewData(
  review: Omit<ApplicationReviewData, "id">,
) {
  const reviewData = collection(db, REVIEW_DATA_COLLECTION);
  const id = uuidv4();
  const reviewDoc: ApplicationReviewData = {
    id: id,
    ...review,
  };
  const docRef = doc(reviewData, id);

  await setDoc(docRef, reviewDoc);

  return reviewDoc;
}

export async function updateReviewData(
  reviewDataId: string,
  update: Partial<Omit<ApplicationReviewData, "id">>,
) {
  const reviewData = collection(db, REVIEW_DATA_COLLECTION);
  const reviewRef = doc(reviewData, reviewDataId);

  await updateDoc(reviewRef, update);
}

export async function getReviewDataForReviewer(
  formId: string,
  reviewerId: string,
) {
  const reviewData = collection(db, REVIEW_DATA_COLLECTION);
  const q = query(
    reviewData,
    where("reviewerId", "==", reviewerId),
    where("applicationFormId", "==", formId),
  );
  const result = await getDocs(q);

  return result.docs.map((doc) => doc.data() as ApplicationReviewData);
}

export async function getReviewDataForResponseRole(
  formId: string,
  responseId: string,
  role: ApplicantRole,
) {
  const reviewData = collection(db, REVIEW_DATA_COLLECTION);
  const q = query(
    reviewData,
    where("applicationFormId", "==", formId),
    where("applicationResponseId", "==", responseId),
    where("forRole", "==", role),
  );
  const result = await getDocs(q);

  return result.docs.map((doc) => doc.data() as ApplicationReviewData);
}

export async function getReviewDataForForm(formId: string) {
  const reviewData = collection(db, REVIEW_DATA_COLLECTION);
  const q = query(reviewData, where("applicationFormId", "==", formId));
  const result = await getDocs(q);

  return result.docs.map((doc) => doc.data() as ApplicationReviewData);
}
