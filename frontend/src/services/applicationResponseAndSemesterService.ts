import type { CollectionReference } from "firebase/firestore";
import { collection, getDocs, query, where } from "firebase/firestore";

import { db } from "@/config/firebase";
import type { ApplicationForm, ApplicationResponse } from "@/types/types";

import { getApplicationResponses } from "./applicationResponsesService";

export const APPLICATION_RESPONSES_COLLECTION = "application-responses";
export const APPLICATION_FORMS_COLLECTION = "application-forms";

export type ApplicationResponseWithSemester = ApplicationResponse & {
  semester: string;
  active: boolean;
};

export async function getApplicationResponseAndSemester(
  userId: string,
): Promise<ApplicationResponseWithSemester[]> {
  const forms = collection(
    db,
    APPLICATION_FORMS_COLLECTION,
  ) as CollectionReference<ApplicationForm>;

  const rawResponses = await getApplicationResponses(userId);
  const responsesWithSemester: ApplicationResponseWithSemester[] = [];

  for (const response of rawResponses) {
    const formQuery = query(
      forms,
      where("id", "==", response.applicationFormId),
    );
    const formResults = await getDocs(formQuery);
    const matchedForms = formResults.docs.map(
      (d) => d.data() as ApplicationForm,
    );

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
