import { FirestoreCollection } from "@app-portal/shared/constants";

import type { UserProfile } from "../models/user";
import { appCollection } from "./firestore";

export async function getUserById(
  id: string,
): Promise<UserProfile | undefined> {
  const res = await appCollection(FirestoreCollection.Users).doc(id).get();
  return res.data();
}
