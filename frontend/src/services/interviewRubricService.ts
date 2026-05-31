import type { ApplicantRole } from "@app-portal/shared/constants";
import type { RoleReviewRubric } from "@app-portal/shared/types";
import axios from "axios";
import { collection, getDocs, query, where } from "firebase/firestore";

import { API_URL, db } from "@/config/firebase";

import { getAppCheckToken } from "./appCheckService";

const INTERVIEW_RUBRIC_COLLECTION = "interview-rubrics";

export async function getRoleInterviewRubricsForForm(
  formId: string,
): Promise<RoleReviewRubric[]> {
  const interviewRubrics = collection(db, INTERVIEW_RUBRIC_COLLECTION);
  const q = query(interviewRubrics, where("formId", "==", formId));

  return (await getDocs(q)).docs.map((d) => d.data() as RoleReviewRubric);
}

export async function getRoleInterviewRubricsForFormRole(
  formId: string,
  role: ApplicantRole,
): Promise<RoleReviewRubric[]> {
  const interviewRubrics = collection(db, INTERVIEW_RUBRIC_COLLECTION);
  const q = query(interviewRubrics, where("formId", "==", formId));

  return (await getDocs(q)).docs
    .map((d) => d.data() as RoleReviewRubric)
    .filter((r) => r.roles.length === 0 || r.roles.includes(role));
}

export async function uploadInterviewRubrics(
  interviewRubrics: RoleReviewRubric[],
  token: string,
) {
  const appCheckToken = await getAppCheckToken();
  return await axios.post(
    API_URL + "/application/interview-rubrics",
    interviewRubrics,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "X-APPCHECK": appCheckToken,
      },
    },
  );
}
