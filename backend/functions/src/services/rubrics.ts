import { FirestoreCollection } from "@app-portal/shared/constants";
import type { RoleReviewRubric } from "@app-portal/shared/types";
import type { Transaction } from "firebase-admin/firestore";

import { appCollection } from "../utils/firestore";
import { runTransaction } from "./db";

export type RubricKind = "review" | "interview";

function rubrics(kind: RubricKind) {
  return appCollection(
    kind === "review"
      ? FirestoreCollection.Rubrics
      : FirestoreCollection.InterviewRubrics,
  );
}

export async function listRubricsForForm(kind: RubricKind, formId: string) {
  return (await rubrics(kind).where("formId", "==", formId).get()).docs.map(
    (d) => d.data(),
  );
}

export async function replaceRubricsForForm(
  kind: RubricKind,
  formId: string,
  newRubrics: RoleReviewRubric[],
  tx?: Transaction,
) {
  const collection = rubrics(kind);
  const existing = (await collection.where("formId", "==", formId).get()).docs;

  if (tx) {
    for (const doc of existing) tx.delete(collection.doc(doc.id));
    for (const rubric of newRubrics) tx.set(collection.doc(rubric.id), rubric);
  } else {
    await runTransaction(async (tx) => {
      for (const doc of existing) tx.delete(collection.doc(doc.id));
      for (const rubric of newRubrics)
        tx.set(collection.doc(rubric.id), rubric);
    });
  }
}
