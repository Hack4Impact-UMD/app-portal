import {
  ApplicationStatus,
  FirestoreCollection,
  QuestionType,
} from "@app-portal/shared/constants";
import type {
  SectionResponse,
  ValidationError,
} from "@app-portal/shared/types";
import axios from "axios";
import {
  setDoc,
  Timestamp,
  arrayUnion,
  doc,
  getDocs,
  query,
  updateDoc,
  where,
  getDoc,
} from "firebase/firestore";
import { v4 as uuidv4 } from "uuid";

import { API_URL } from "@/config/firebase";
import type { ApplicationForm, ApplicationResponse } from "@/types/types";

import { getAppCheckToken } from "./appCheckService";
import { getApplicationForm } from "./applicationFormsService";
import { appCollection } from "./firestore";

export async function saveApplicationResponse(
  response: ApplicationResponse,
  token: string,
) {
  console.log("saving...");
  const appCheckToken = await getAppCheckToken();
  const res = await axios.put(
    API_URL + "/application/save/" + response.id,
    response,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "X-APPCHECK": appCheckToken,
      },
    },
  );

  const data = res.data as ApplicationResponse;

  return data;
}

export async function getApplicationResponses(
  userId: string,
): Promise<ApplicationResponse[]> {
  const responses = appCollection(FirestoreCollection.ApplicationResponses);
  const q = query(responses, where("userId", "==", userId));
  const results = await getDocs(q);

  return results.docs.map((d) => d.data());
}

export async function getApplicationResponseById(
  responseId: string,
): Promise<ApplicationResponse | undefined> {
  const responses = appCollection(FirestoreCollection.ApplicationResponses);
  const respDoc = doc(responses, responseId);
  const response: ApplicationResponse | undefined = (
    await getDoc(respDoc)
  ).data();
  return response;
}

async function getApplicationResponseByFormId(
  userId: string,
  formId: string,
): Promise<ApplicationResponse | undefined> {
  const responses = appCollection(FirestoreCollection.ApplicationResponses);
  const q = query(
    responses,
    where("userId", "==", userId),
    where("applicationFormId", "==", formId),
  );
  const results = await getDocs(q);

  if (results.empty) {
    return undefined;
  }

  const doc = results.docs[0];
  const data = doc.data();

  return data;
}

export async function getAllApplicationResponsesByFormId(
  formId: string,
): Promise<ApplicationResponse[]> {
  const responses = appCollection(FirestoreCollection.ApplicationResponses);
  const q = query(responses, where("applicationFormId", "==", formId));

  const results = await getDocs(q);

  return results.docs.map((d) => d.data());
}

async function fetchOrCreateApplicationResponse(
  userId: string,
  form: ApplicationForm,
): Promise<ApplicationResponse> {
  const existingApplicationResponse = await getApplicationResponseByFormId(
    userId,
    form.id,
  );

  if (existingApplicationResponse) {
    console.log("found existing");
    console.log(existingApplicationResponse);
    return existingApplicationResponse;
  }
  console.log("creating new response object!");

  const sectionResponses = form.sections.map(
    (section): SectionResponse => ({
      sectionId: section.sectionId,
      sectionName: section.sectionName,
      questions: section.questions.map((question) => ({
        questionId: question.questionId,
        questionType: question.questionType,
        applicationFormId: form.id,
        response:
          question.questionType === QuestionType.MultipleSelect ||
          question.questionType === QuestionType.RoleSelect
            ? []
            : "",
      })),
    }),
  );

  const newResponse: ApplicationResponse = {
    id: uuidv4(),
    userId,
    applicationFormId: form.id,
    sectionResponses,
    status: ApplicationStatus.InProgress,
    dateSubmitted: Timestamp.now(),
    rolesApplied: [],
  };

  console.log("new response:");
  console.log(newResponse);

  const docRef = doc(
    appCollection(FirestoreCollection.ApplicationResponses),
    newResponse.id,
  );

  await setDoc(docRef, newResponse);

  const userRef = doc(appCollection(FirestoreCollection.Users), userId);
  await updateDoc(userRef, {
    activeApplications: arrayUnion(form.id),
  });

  return newResponse;
}

type SuccessfulSubmitResponse = {
  status: "success";
  application: ApplicationResponse;
};

type ErrorApplicationResponse = {
  status: "error";
  validationErrors: ValidationError[];
};

export type ApplicationSubmitResponse =
  | SuccessfulSubmitResponse
  | ErrorApplicationResponse;

export async function submitApplicationResponse(
  response: ApplicationResponse,
  token: string,
): Promise<ApplicationSubmitResponse> {
  const appCheckToken = await getAppCheckToken();
  const res = await axios.post(API_URL + "/application/submit", response, {
    headers: {
      Authorization: `Bearer ${token}`,
      "X-APPCHECK": appCheckToken,
    },
  });

  const data = res.data as ApplicationSubmitResponse;

  return data;
}

export async function fetchMyApplicationResponseAndForm(
  userId: string,
  formId: string,
) {
  const form = await getApplicationForm(formId);
  console.log(`form found: ${form.semester}`);

  const response = await fetchOrCreateApplicationResponse(userId, form);
  console.log(`got response: ${response.id}`);

  return { form, response };
}
