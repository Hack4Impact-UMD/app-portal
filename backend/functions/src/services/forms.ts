import { FirestoreCollection } from "@app-portal/shared/constants";
import type { Transaction, UpdateData } from "firebase-admin/firestore";

import { db } from "..";
import type { ApplicationForm } from "../models/appForm";
import { getDocsById } from "../utils/batch";
import { appCollection } from "../utils/firestore";

// gRPC status code Firestore returns when create() hits an existing document.
const ALREADY_EXISTS = 6;

const forms = () => appCollection(FirestoreCollection.ApplicationForms);

export async function getForm(id: string, tx?: Transaction) {
  const ref = forms().doc(id);
  return (await (tx ? tx.get(ref) : ref.get())).data();
}

export function getForms(ids: Iterable<string>) {
  return getDocsById(forms(), ids);
}

export async function listForms() {
  return (await forms().get()).docs.map((d) => ({ ...d.data(), id: d.id }));
}

export async function listActiveForms() {
  return (await forms().where("isActive", "==", true).get()).docs.map((d) =>
    d.data(),
  );
}

export async function listFormsInvitingUser(uid: string) {
  return (
    await forms().where("invitedUsers", "array-contains", uid).get()
  ).docs.map((d) => d.data());
}

// Returns false if a form with this ID already exists.
export async function createForm(form: ApplicationForm) {
  try {
    await forms().doc(form.id).create(form);
    return true;
  } catch (error) {
    if ((error as { code?: number }).code === ALREADY_EXISTS) return false;
    throw error;
  }
}

export async function setForm(form: ApplicationForm) {
  await forms().doc(form.id).set(form);
}

export async function updateForm(
  id: string,
  patch: UpdateData<ApplicationForm>,
) {
  await forms().doc(id).update(patch);
}

// Only one form may be active at a time.
export async function setActiveForm(id: string, active: boolean) {
  const batch = db.batch();
  batch.update(forms().doc(id), { isActive: active });
  if (active) {
    const others = await forms().where("isActive", "==", true).get();
    for (const d of others.docs) {
      if (d.id !== id) batch.update(d.ref, { isActive: false });
    }
  }
  await batch.commit();
}
