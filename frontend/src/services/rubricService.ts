import type { ApplicantRole } from "@app-portal/shared/constants";
import type { RoleReviewRubric } from "@app-portal/shared/types";
import axios from "axios";
import { collection, getDocs, query, where } from "firebase/firestore";

import { API_URL, db } from "@/config/firebase";
import type { ApplicationForm } from "@/types/types";

import { getAppCheckToken } from "./appCheckService";

const RUBRIC_COLLECTION = "rubrics";

export interface RubricValidationWarnings {
  missingInForm: Array<{ role: ApplicantRole; scoreKey: string }>;
  missingInRubric: Array<{ role: ApplicantRole; scoreWeight: string }>;
}

export async function getRoleRubricsForForm(
  formId: string,
): Promise<RoleReviewRubric[]> {
  const rubrics = collection(db, RUBRIC_COLLECTION);
  const q = query(rubrics, where("formId", "==", formId));

  return (await getDocs(q)).docs.map((d) => d.data() as RoleReviewRubric);
}

export async function getRoleRubricsForFormRole(
  formId: string,
  role: ApplicantRole,
): Promise<RoleReviewRubric[]> {
  const rubrics = collection(db, RUBRIC_COLLECTION);
  const q = query(rubrics, where("formId", "==", formId));

  return (await getDocs(q)).docs
    .map((d) => d.data() as RoleReviewRubric)
    .filter((r) => r.roles.length === 0 || r.roles.includes(role));
}

export async function uploadRubrics(
  rubrics: RoleReviewRubric[],
  token: string,
) {
  return await axios.post(API_URL + "/application/rubrics", rubrics, {
    headers: {
      Authorization: `Bearer ${token}`,
      "X-APPCHECK": await getAppCheckToken(),
    },
  });
}

export function validateRubricScoreKeys(
  rubrics: RoleReviewRubric[],
  form: ApplicationForm,
  isInterview: boolean = false,
): RubricValidationWarnings {
  const weights = isInterview ? form.interviewScoreWeights : form.scoreWeights;
  if (!weights) {
    return { missingInForm: [], missingInRubric: [] };
  }

  const missingInForm: Array<{ role: ApplicantRole; scoreKey: string }> = [];
  const missingInRubric: Array<{ role: ApplicantRole; scoreWeight: string }> =
    [];

  const allRoles = Object.keys(weights) as ApplicantRole[];

  allRoles.forEach((role) => {
    const roleWeights = weights[role];
    if (!roleWeights) return;

    // find relevant form weights and rubric keys for this role
    const formScoreWeights = new Set(Object.keys(roleWeights));
    const rubricScoreKeys = new Set<string>();
    rubrics.forEach((rubric) => {
      const appliesToRole =
        rubric.roles.length === 0 || rubric.roles.includes(role);
      if (appliesToRole) {
        rubric.rubricQuestions.forEach((question) => {
          rubricScoreKeys.add(question.scoreKey);
        });
      }
    });

    // find rubric keys missing from form weights
    rubricScoreKeys.forEach((scoreKey) => {
      if (!formScoreWeights.has(scoreKey)) {
        missingInForm.push({ role, scoreKey });
      }
    });

    // find form weights missing from rubric keys
    formScoreWeights.forEach((scoreWeight) => {
      if (!rubricScoreKeys.has(scoreWeight)) {
        missingInRubric.push({ role, scoreWeight });
      }
    });
  });

  return { missingInForm, missingInRubric };
}
