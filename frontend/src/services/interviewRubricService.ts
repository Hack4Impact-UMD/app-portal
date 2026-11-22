import { FirestoreCollection } from "@app-portal/shared/constants";
import type { ApplicantRole } from "@app-portal/shared/constants";
import type { RoleReviewRubric } from "@app-portal/shared/types";
import { getDocs, query, where } from "firebase/firestore";

import { trpcClient } from "@/config/trpc";

import { appCollection } from "./firestore";

export async function getRoleInterviewRubricsForForm(
  formId: string,
): Promise<RoleReviewRubric[]> {
  const interviewRubrics = appCollection(FirestoreCollection.InterviewRubrics);
  const q = query(interviewRubrics, where("formId", "==", formId));

  return (await getDocs(q)).docs.map((d) => d.data());
}

export async function getRoleInterviewRubricsForFormRole(
  formId: string,
  role: ApplicantRole,
): Promise<RoleReviewRubric[]> {
  const interviewRubrics = appCollection(FirestoreCollection.InterviewRubrics);
  const q = query(interviewRubrics, where("formId", "==", formId));

  return (await getDocs(q)).docs
    .map((d) => d.data())
    .filter((r) => r.roles.length === 0 || r.roles.includes(role));
}

export async function uploadInterviewRubrics(
  interviewRubrics: RoleReviewRubric[],
) {
  return trpcClient.application.uploadInterviewRubrics.mutate(interviewRubrics);
}
