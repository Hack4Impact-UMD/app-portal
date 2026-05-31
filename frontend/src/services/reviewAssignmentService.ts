import type { ApplicantRole } from "@app-portal/shared/constants";
import type { AppReviewAssignment } from "@app-portal/shared/types";
import {
  and,
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  setDoc,
  where,
} from "firebase/firestore";
import { v4 as uuidv4 } from "uuid";

import { db } from "@/config/firebase";

import { getApplicationResponseById } from "./applicationResponsesService";

export const REVIEW_ASSIGNMENT_COLLECTION = "review-assignments";

export async function assignReview(
  responseId: string,
  reviewerId: string,
  role: ApplicantRole,
) {
  const response = await getApplicationResponseById(responseId);

  if (!response)
    throw new Error(
      `Attempting to assign reviewer to non-existent response with id ${responseId}`,
    );

  const reviewAssignment: AppReviewAssignment = {
    id: uuidv4(),
    assignmentType: "review",
    applicantId: response.userId,
    applicationResponseId: responseId,
    forRole: role,
    formId: response.applicationFormId,
    reviewerId: reviewerId,
  };

  const assignments = collection(db, REVIEW_ASSIGNMENT_COLLECTION);
  await setDoc(doc(assignments, reviewAssignment.id), reviewAssignment);

  return reviewAssignment;
}

export async function removeReviewAssignment(assignmentId: string) {
  const assignments = collection(db, REVIEW_ASSIGNMENT_COLLECTION);
  const assignment = doc(assignments, assignmentId);
  await deleteDoc(assignment);
}

export async function getReviewAssignments(
  formId: string,
  reviewerId: string,
): Promise<AppReviewAssignment[]> {
  const assignments = collection(db, REVIEW_ASSIGNMENT_COLLECTION);
  const q = query(
    assignments,
    and(
      where("formId", "==", formId),
      where("reviewerId", "==", reviewerId),
      where("assignmentType", "==", "review"),
    ),
  );

  const res = await getDocs(q);

  return res.docs.map((d) => d.data() as AppReviewAssignment);
}

export async function getReviewAssignmentsForApplication(
  responseId: string,
): Promise<AppReviewAssignment[]> {
  const assignments = collection(db, REVIEW_ASSIGNMENT_COLLECTION);
  const q = query(
    assignments,
    where("applicationResponseId", "==", responseId),
  );

  return (await getDocs(q)).docs.map((d) => d.data() as AppReviewAssignment);
}

export async function getReviewAssignmentsForForm(formId: string) {
  const assignments = collection(db, REVIEW_ASSIGNMENT_COLLECTION);
  const q = query(assignments, where("formId", "==", formId));

  return (await getDocs(q)).docs.map((d) => d.data() as AppReviewAssignment);
}
