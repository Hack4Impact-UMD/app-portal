import { FirestoreCollection } from "@app-portal/shared/constants";
import { getDocs, query, where } from "firebase/firestore";

import type { ApplicationResponse } from "@/types/types";

import { getApplicationResponses } from "./applicationResponsesService";
import { appCollection } from "./firestore";

export type ApplicationResponseWithSemester = ApplicationResponse & {
  semester: string;
  active: boolean;
};

export async function getApplicationResponseAndSemester(
  userId: string,
): Promise<ApplicationResponseWithSemester[]> {
  const forms = appCollection(FirestoreCollection.ApplicationForms);

  const rawResponses = await getApplicationResponses(userId);
  const responsesWithSemester: ApplicationResponseWithSemester[] = [];

  for (const response of rawResponses) {
    const formQuery = query(
      forms,
      where("id", "==", response.applicationFormId),
    );
    const formResults = await getDocs(formQuery);
    const matchedForms = formResults.docs.map((d) => d.data());

    const form = matchedForms.length > 0 ? matchedForms[0] : undefined;
    const semester = form?.semester ?? "Unknown";

    if (form) {
      responsesWithSemester.push({
        ...response,
        semester,
        active: form.isActive,
      });
    }
  }

  return responsesWithSemester;
}
