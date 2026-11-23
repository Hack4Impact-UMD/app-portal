import {
  ApplicantRole,
  FirestoreCollection,
  PermissionRole,
} from "@app-portal/shared/constants";
import type { Transaction, UpdateData } from "firebase-admin/firestore";
import { FieldValue } from "firebase-admin/firestore";

import { db } from "..";
import type { UserProfile } from "../models/user";
import { isReviewCapable, REVIEW_CAPABLE_ROLES } from "../models/user";
import { getDocsById } from "../utils/batch";
import { appCollection } from "../utils/firestore";

const users = () => appCollection(FirestoreCollection.Users);

export async function getUser(id: string) {
  return (await users().doc(id).get()).data();
}

export function getUsers(ids: Iterable<string>) {
  return getDocsById(users(), ids);
}

export async function listUsers() {
  return (await users().get()).docs.map((d) => d.data());
}

export async function listUsersByRole(role: PermissionRole) {
  return (await users().where("role", "==", role).get()).docs.map((d) =>
    d.data(),
  );
}

export async function listReviewCapableUsers() {
  // NOTE: if the inactive field does not exist, querying on it never matches,
  // so inactive users are filtered here instead.
  return (await users().where("role", "in", REVIEW_CAPABLE_ROLES).get()).docs
    .map((d) => d.data())
    .filter(isReviewCapable)
    .filter((u) => !u.inactive);
}

export async function createUser(user: UserProfile, tx?: Transaction) {
  const ref = users().doc(user.id);
  if (tx) tx.create(ref, user);
  else await ref.create(user);
}

// Throws if the user doc doesn't exist.
export async function updateUser(id: string, patch: UpdateData<UserProfile>) {
  await users().doc(id).update(patch);
}

export function addActiveApplication(
  uid: string,
  formId: string,
  tx: Transaction,
) {
  tx.update(users().doc(uid), {
    activeApplications: FieldValue.arrayUnion(formId),
  });
}

export async function setUsersRole(ids: string[], role: PermissionRole) {
  const found = await getUsers(ids);
  const batch = db.batch();
  for (const [id, user] of found) {
    const update: Record<string, unknown> = { role };
    if (
      role === PermissionRole.Reviewer &&
      !("applicantRolePreferences" in user)
    ) {
      update.applicantRolePreferences = Object.values(ApplicantRole);
    }
    if (role === PermissionRole.Board && !("applicantRoles" in user)) {
      update.applicantRoles = [];
    }
    batch.update(users().doc(id), update);
  }
  await batch.commit();
}

export async function deleteUsers(ids: string[]) {
  const batch = db.batch();
  for (const id of ids) batch.delete(users().doc(id));
  await batch.commit();
}
