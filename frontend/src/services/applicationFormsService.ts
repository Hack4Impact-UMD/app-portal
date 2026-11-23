import { FirestoreCollection } from "@app-portal/shared/constants";
import { doc, Timestamp, updateDoc } from "firebase/firestore";

import { isTRPCClientError, trpcClient } from "@/config/trpc";
import type { ApplicationForm } from "@/types/types";

import { appCollection } from "./firestore";

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
