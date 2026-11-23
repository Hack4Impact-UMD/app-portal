import { FirestoreCollection } from "@app-portal/shared/constants";
import type { ApplicationInterviewData } from "@app-portal/shared/types";
import type { UpdateData } from "firebase-admin/firestore";

import { appCollection } from "../utils/firestore";
import { listDocs } from "./db";

const interviewData = () => appCollection(FirestoreCollection.InterviewData);

export async function getInterviewData(id: string) {
  return (await interviewData().doc(id).get()).data();
}

export function listInterviewDataForForm(formId: string) {
  return listDocs(interviewData().where("applicationFormId", "==", formId));
}

export function listInterviewDataForInterviewer(
  formId: string,
  interviewerId: string,
) {
  return listDocs(
    interviewData()
      .where("interviewerId", "==", interviewerId)
      .where("applicationFormId", "==", formId),
  );
}

export function listInterviewDataForResponse(responseId: string) {
  return listDocs(
    interviewData().where("applicationResponseId", "==", responseId),
  );
}

export async function createInterviewData(data: ApplicationInterviewData) {
  await interviewData().doc(data.id).create(data);
}

export async function updateInterviewData(
  id: string,
  patch: UpdateData<ApplicationInterviewData>,
) {
  await interviewData().doc(id).update(patch);
}
