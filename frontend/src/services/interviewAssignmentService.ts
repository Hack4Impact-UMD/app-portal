import type { ApplicantRole } from "@app-portal/shared/constants";
import type { InterviewAssignment } from "@app-portal/shared/types";
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

export const INTERVIEW_ASSIGNMENT_COLLECTION = "interview-assignments";

export async function assignInterview(
  responseId: string,
  interviewerId: string,
  role: ApplicantRole,
) {
  const response = await getApplicationResponseById(responseId);

  if (!response)
    throw new Error(
      `Attempting to assign interviewer to non-existent response with id ${responseId}`,
    );

  const interviewAssignment: InterviewAssignment = {
    id: uuidv4(),
    assignmentType: "interview",
    applicantId: response.userId,
    applicationResponseId: responseId,
    forRole: role,
    formId: response.applicationFormId,
    interviewerId: interviewerId,
  };

  const assignments = collection(db, INTERVIEW_ASSIGNMENT_COLLECTION);
  await setDoc(doc(assignments, interviewAssignment.id), interviewAssignment);

  return interviewAssignment;
}

export async function removeInterviewAssignment(assignmentId: string) {
  const assignments = collection(db, INTERVIEW_ASSIGNMENT_COLLECTION);
  const assignment = doc(assignments, assignmentId);
  await deleteDoc(assignment);
}

export async function getInterviewAssignments(
  formId: string,
  interviewerId: string,
): Promise<InterviewAssignment[]> {
  const assignments = collection(db, INTERVIEW_ASSIGNMENT_COLLECTION);
  const q = query(
    assignments,
    and(
      where("formId", "==", formId),
      where("interviewerId", "==", interviewerId),
      where("assignmentType", "==", "interview"),
    ),
  );

  const res = await getDocs(q);

  return res.docs.map((d) => d.data() as InterviewAssignment);
}

export async function getInterviewAssignmentsForApplication(
  responseId: string,
): Promise<InterviewAssignment[]> {
  const assignments = collection(db, INTERVIEW_ASSIGNMENT_COLLECTION);
  const q = query(
    assignments,
    where("applicationResponseId", "==", responseId),
  );

  return (await getDocs(q)).docs.map((d) => d.data() as InterviewAssignment);
}

export async function getInterviewAssignmentsForForm(formId: string) {
  const assignments = collection(db, INTERVIEW_ASSIGNMENT_COLLECTION);
  const q = query(assignments, where("formId", "==", formId));

  return (await getDocs(q)).docs.map((d) => d.data() as InterviewAssignment);
}
