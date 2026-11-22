import { FirestoreCollection } from "@app-portal/shared/constants";
import {
  doc,
  FirestoreError,
  getDoc,
  getDocs,
  query,
  Timestamp,
  updateDoc,
  where,
} from "firebase/firestore";

import { isTRPCClientError, trpcClient } from "@/config/trpc";
import type { ApplicationForm } from "@/types/types";

import { getApplicationResponseById } from "./applicationResponsesService";
import { appCollection } from "./firestore";

export async function getApplicationForm(
  formId: string,
): Promise<ApplicationForm> {
  const forms = appCollection(FirestoreCollection.ApplicationForms);
  const form = await getDoc(doc(forms, formId));

  if (!form.exists())
    throw new Error(`Application form with ID ${formId} does not exist`);

  return form.data();
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
  const formsRef = appCollection(FirestoreCollection.ApplicationForms);
  const snapshot = await getDocs(formsRef);

  const forms: ApplicationForm[] = snapshot.docs.map((doc) => ({
    ...doc.data(),
    id: doc.id,
  }));

  return forms;
}

/**
 * Thrown when there is no active form this caller can see. Callers should
 * check `instanceof NoActiveFormError` rather than matching on the message.
 */
export class NoActiveFormError extends Error {
  constructor() {
    super("No active form!");
    this.name = "NoActiveFormError";
  }
}

export async function getActiveForm(): Promise<ApplicationForm> {
  const forms = appCollection(FirestoreCollection.ApplicationForms);
  const q = query(forms, where("isActive", "==", true));

  let docs;
  try {
    docs = (await getDocs(q)).docs.map((d) => d.data());
  } catch (err) {
    // The active form may be a private one this caller isn't invited to,
    // which Firestore rules reject as permission-denied for the whole
    // query. Treat that the same as there being no active form to show —
    // but log the original error, since a misconfigured ruleset, an
    // unverified email or a missing user document land here too and would
    // otherwise be indistinguishable from "nothing to apply to".
    if (err instanceof FirestoreError && err.code === "permission-denied") {
      console.warn(
        "Active form query was denied, treating as no active form:",
        err,
      );
      throw new NoActiveFormError();
    }
    throw err;
  }

  if (docs.length === 0) throw new NoActiveFormError();
  return docs[0];
}

export async function getInvitedFormsForUser(
  userId: string,
): Promise<ApplicationForm[]> {
  const forms = appCollection(FirestoreCollection.ApplicationForms);
  const q = query(forms, where("invitedUsers", "array-contains", userId));

  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => d.data());
}

/** Thrown when creating a form whose ID is already taken. */
export class FormIdTakenError extends Error {
  constructor(formId: string) {
    super(`A form with the ID "${formId}" already exists`);
    this.name = "FormIdTakenError";
  }
}

export async function createApplicationForm(
  form: ApplicationForm,
  // The endpoint upserts by default (the form builder saves through it too).
  // Pass createOnly for new forms so the backend rejects a taken ID
  // atomically instead of silently overwriting an existing form.
  { createOnly = false }: { createOnly?: boolean } = {},
): Promise<{ status: string; formId: string }> {
  try {
    return await trpcClient.application.createForm.mutate({ form, createOnly });
  } catch (err) {
    if (isTRPCClientError(err) && err.data?.code === "CONFLICT") {
      throw new FormIdTakenError(form.id);
    }
    throw err;
  }
}

export async function setFormDecisionRelease(
  formId: string,
  released: boolean,
) {
  const forms = appCollection(FirestoreCollection.ApplicationForms);
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
  const forms = appCollection(FirestoreCollection.ApplicationForms);
  const docRef = doc(forms, formId);

  const update: Partial<ApplicationForm> = {
    isActive: active,
  };

  await updateDoc(docRef, update);
}

export async function setApplicationFormDueDate(formId: string, dueDate: Date) {
  const forms = appCollection(FirestoreCollection.ApplicationForms);
  const docRef = doc(forms, formId);

  const update: Partial<ApplicationForm> = {
    dueDate: Timestamp.fromDate(dueDate),
  };

  await updateDoc(docRef, update);
}

export async function setApplicationFormInvitedUsers(
  formId: string,
  invitedUsers: string[],
) {
  const forms = appCollection(FirestoreCollection.ApplicationForms);
  const docRef = doc(forms, formId);

  const update: Partial<ApplicationForm> = {
    invitedUsers,
  };

  await updateDoc(docRef, update);
}
