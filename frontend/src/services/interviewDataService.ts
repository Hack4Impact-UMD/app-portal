import { FirestoreCollection } from "@app-portal/shared/constants";
import type { ApplicantRole } from "@app-portal/shared/constants";
import type {
  InterviewAssignment,
  ApplicationInterviewData,
} from "@app-portal/shared/types";
import {
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";
import { v4 as uuidv4 } from "uuid";

import { appCollection } from "./firestore";

export async function getInterviewDataForResponseRole(
  formId: string,
  responseId: string,
  role: ApplicantRole,
) {
  const interviewData = appCollection(FirestoreCollection.InterviewData);
  const q = query(
    interviewData,
    where("applicationFormId", "==", formId),
    where("applicationResponseId", "==", responseId),
    where("forRole", "==", role),
  );
  const result = await getDocs(q);

  return result.docs.map((doc) => doc.data());
}

export async function getInterviewDataById(id: string) {
  const interviewData = appCollection(FirestoreCollection.InterviewData);
  const docRef = doc(interviewData, id);

  return (await getDoc(docRef)).data() as ApplicationInterviewData;
}

export async function updateInterviewData(
  interviewDataId: string,
  update: Partial<Omit<ApplicationInterviewData, "id">>,
) {
  const interviewData = appCollection(FirestoreCollection.InterviewData);
  const interviewRef = doc(interviewData, interviewDataId);

  await updateDoc(interviewRef, update);
}

export async function getInterviewDataForAssignment(
  assignment: InterviewAssignment,
) {
  const reviewData = appCollection(FirestoreCollection.InterviewData);
  const q = query(
    reviewData,
    where("applicantId", "==", assignment.applicantId),
    where("forRole", "==", assignment.forRole),
    where("applicationFormId", "==", assignment.formId),
    where("interviewerId", "==", assignment.interviewerId),
  );
  const result = await getDocs(q);

  if (result.docs.length < 1) return undefined;

  return result.docs[0].data();
}

export async function createInterviewData(
  review: Omit<ApplicationInterviewData, "id">,
) {
  const reviewData = appCollection(FirestoreCollection.InterviewData);
  const id = uuidv4();
  const reviewDoc: ApplicationInterviewData = {
    id: id,
    ...review,
  };
  const docRef = doc(reviewData, id);

  await setDoc(docRef, reviewDoc);

  return reviewDoc;
}

export async function getInterviewDataForForm(formId: string) {
  const interviewData = appCollection(FirestoreCollection.InterviewData);
  const q = query(interviewData, where("applicationFormId", "==", formId));
  const result = await getDocs(q);

  return result.docs.map((doc) => doc.data());
}

export async function getInterviewDataForInterviewer(
  formId: string,
  interviewerId: string,
) {
  const interviewData = appCollection(FirestoreCollection.InterviewData);
  const q = query(
    interviewData,
    where("interviewerId", "==", interviewerId),
    where("applicationFormId", "==", formId),
  );
  const result = await getDocs(q);

  return result.docs.map((doc) => doc.data());
}

export async function getInterviewDataForResponse(
  applicationResponseId: string,
) {
  const interviewData = appCollection(FirestoreCollection.InterviewData);
  const q = query(
    interviewData,
    where("applicationResponseId", "==", applicationResponseId),
  );
  const result = await getDocs(q);

  return result.docs.map((doc) => doc.data());
}
