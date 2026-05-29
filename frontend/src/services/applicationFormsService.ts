import axios from "axios";
import type { CollectionReference } from "firebase/firestore";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  Timestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { query } from "firebase/firestore";

import { db, API_URL } from "@/config/firebase";
import type { ApplicationForm } from "@/types/types";

import { getAppCheckToken } from "./appCheckService";
import { getApplicationResponseById } from "./applicationResponsesService";

export const APPLICATION_FORMS_COLLECTION = "application-forms";

export async function getApplicationForm(
  formId: string,
): Promise<ApplicationForm> {
  const forms = collection(db, APPLICATION_FORMS_COLLECTION);
  const form = await getDoc(doc(forms, formId));

  if (!form.exists())
    throw new Error(`Application form with ID ${formId} does not exist`);

  return form.data() as ApplicationForm;
}

export async function getApplicationFormForResponseId(
  responseId: string,
): Promise<ApplicationForm> {
  const response = await getApplicationResponseById(responseId);
  if (!response) {
    throw new Error("No response for this ID!");
  }
  const form = await getApplicationForm(response.applicationFormId);
  return form;
}

export async function getAllForms(): Promise<ApplicationForm[]> {
  const formsRef = collection(db, APPLICATION_FORMS_COLLECTION);
  const snapshot = await getDocs(formsRef);

  const forms: ApplicationForm[] = snapshot.docs.map((doc) => ({
    ...doc.data(),
    id: doc.id,
  })) as ApplicationForm[];

  return forms;
}

export async function getActiveForm(): Promise<ApplicationForm> {
  const forms = collection(db, APPLICATION_FORMS_COLLECTION);
  const q = query(forms, where("isActive", "==", true));

  const docs = (await getDocs(q)).docs.map((d) => d.data());
  console.log(docs);
  if (docs.length > 0) return docs[0] as ApplicationForm;
  else {
    throw new Error("No active form!");
  }
}

export async function createApplicationForm(
  form: ApplicationForm,
  token: string,
): Promise<{ status: string; formId: string }> {
  const res = await axios.post(API_URL + "/application/forms", form, {
    headers: {
      Authorization: `Bearer ${token}`,
      "X-APPCHECK": await getAppCheckToken(),
    },
  });
  return res.data;
}

export async function setFormDecisionRelease(
  formId: string,
  released: boolean,
) {
  const forms = collection(
    db,
    APPLICATION_FORMS_COLLECTION,
  ) as CollectionReference<ApplicationForm>;
  const docRef = doc(forms, formId);

  const update: Partial<ApplicationForm> = {
    decisionsReleased: released,
  };

  await updateDoc(docRef, update);
}

export async function setApplicationFormActiveStatus(
  formId: string,
  active: boolean,
) {
  const forms = collection(
    db,
    APPLICATION_FORMS_COLLECTION,
  ) as CollectionReference<ApplicationForm>;
  const docRef = doc(forms, formId);

  const update: Partial<ApplicationForm> = {
    isActive: active,
  };

  await updateDoc(docRef, update);
}

export async function setApplicationFormDueDate(formId: string, dueDate: Date) {
  const forms = collection(
    db,
    APPLICATION_FORMS_COLLECTION,
  ) as CollectionReference<ApplicationForm>;
  const docRef = doc(forms, formId);

  const update: Partial<ApplicationForm> = {
    dueDate: Timestamp.fromDate(dueDate),
  };

  await updateDoc(docRef, update);
}
