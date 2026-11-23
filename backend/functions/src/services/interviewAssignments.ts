import { FirestoreCollection } from "@app-portal/shared/constants";
import type { InterviewAssignment } from "@app-portal/shared/types";

import { queryWhereIn } from "../utils/batch";
import { appCollection } from "../utils/firestore";
import { listDocs } from "./db";

const assignments = () =>
  appCollection(FirestoreCollection.InterviewAssignments);

export async function getInterviewAssignment(id: string) {
  return (await assignments().doc(id).get()).data();
}

export function listInterviewAssignmentsForForm(formId: string) {
  return listDocs(assignments().where("formId", "==", formId));
}

export function listInterviewAssignmentsForInterviewer(
  formId: string,
  interviewerId: string,
) {
  return listDocs(
    assignments()
      .where("formId", "==", formId)
      .where("interviewerId", "==", interviewerId)
      .where("assignmentType", "==", "interview"),
  );
}

export function listInterviewAssignmentsForResponse(responseId: string) {
  return listDocs(
    assignments().where("applicationResponseId", "==", responseId),
  );
}

export function listInterviewAssignmentsForResponses(responseIds: string[]) {
  return queryWhereIn(assignments(), "applicationResponseId", responseIds);
}

export async function isAssignedInterviewer(
  interviewerId: string,
  responseId: string,
) {
  return !(
    await assignments()
      .where("interviewerId", "==", interviewerId)
      .where("applicationResponseId", "==", responseId)
      .limit(1)
      .get()
  ).empty;
}

export async function createInterviewAssignment(
  assignment: InterviewAssignment,
) {
  await assignments().doc(assignment.id).create(assignment);
}

export async function deleteInterviewAssignment(id: string) {
  await assignments().doc(id).delete();
}
