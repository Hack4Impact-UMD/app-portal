import { FirestoreCollection } from "@app-portal/shared/constants";
import type {
  AppReviewAssignment,
  ApplicationReviewData,
} from "@app-portal/shared/types";
import type { UpdateData } from "firebase-admin/firestore";

import { queryWhereIn } from "../utils/batch";
import { appCollection } from "../utils/firestore";
import { listDocs } from "./db";

const reviewData = () => appCollection(FirestoreCollection.ReviewData);

export async function getReviewData(id: string) {
  return (await reviewData().doc(id).get()).data();
}

export function listReviewDataForForm(formId: string) {
  return listDocs(reviewData().where("applicationFormId", "==", formId));
}

export function listReviewDataForReviewer(formId: string, reviewerId: string) {
  return listDocs(
    reviewData()
      .where("reviewerId", "==", reviewerId)
      .where("applicationFormId", "==", formId),
  );
}

export function listReviewDataForReviewers(
  formId: string,
  reviewerIds: string[],
) {
  return queryWhereIn(
    reviewData().where("applicationFormId", "==", formId),
    "reviewerId",
    reviewerIds,
  );
}

export function listReviewDataForResponse(responseId: string) {
  return listDocs(
    reviewData().where("applicationResponseId", "==", responseId),
  );
}

export async function hasReviewStarted(assignment: AppReviewAssignment) {
  return !(
    await reviewData()
      .where("applicantId", "==", assignment.applicantId)
      .where("forRole", "==", assignment.forRole)
      .where("applicationFormId", "==", assignment.formId)
      .where("reviewerId", "==", assignment.reviewerId)
      .limit(1)
      .get()
  ).empty;
}

export async function createReviewData(data: ApplicationReviewData) {
  await reviewData().doc(data.id).create(data);
}

export async function updateReviewData(
  id: string,
  patch: UpdateData<ApplicationReviewData>,
) {
  await reviewData().doc(id).update(patch);
}
