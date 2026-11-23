import { FirestoreCollection } from "@app-portal/shared/constants";
import type { AppReviewAssignment } from "@app-portal/shared/types";

import { queryWhereIn } from "../utils/batch";
import { appCollection } from "../utils/firestore";
import { commitInChunks, listDocs } from "./db";

const assignments = () => appCollection(FirestoreCollection.ReviewAssignments);

export async function getReviewAssignment(id: string) {
  return (await assignments().doc(id).get()).data();
}

export function listReviewAssignmentsForForm(formId: string) {
  return listDocs(assignments().where("formId", "==", formId));
}

export function listReviewAssignmentsForReviewer(
  formId: string,
  reviewerId: string,
) {
  return listDocs(
    assignments()
      .where("formId", "==", formId)
      .where("reviewerId", "==", reviewerId)
      .where("assignmentType", "==", "review"),
  );
}

export function listReviewAssignmentsForResponse(responseId: string) {
  return listDocs(
    assignments().where("applicationResponseId", "==", responseId),
  );
}

export function listReviewAssignmentsForResponses(responseIds: string[]) {
  return queryWhereIn(assignments(), "applicationResponseId", responseIds);
}

export async function isAssignedReviewer(
  reviewerId: string,
  responseId: string,
) {
  return !(
    await assignments()
      .where("reviewerId", "==", reviewerId)
      .where("applicationResponseId", "==", responseId)
      .limit(1)
      .get()
  ).empty;
}

export async function createReviewAssignment(assignment: AppReviewAssignment) {
  await assignments().doc(assignment.id).create(assignment);
}

export async function createReviewAssignments(list: AppReviewAssignment[]) {
  await commitInChunks(list, (batch, a) =>
    batch.create(assignments().doc(a.id), a),
  );
}

export async function deleteReviewAssignment(id: string) {
  await assignments().doc(id).delete();
}
