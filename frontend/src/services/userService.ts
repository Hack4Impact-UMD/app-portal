import {
  ApplicantRole,
  FirestoreCollection,
  PermissionRole,
} from "@app-portal/shared/constants";
import type { SectionResponse } from "@app-portal/shared/types";
import type { User, UserInfo } from "firebase/auth";
import {
  sendEmailVerification,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import {
  doc,
  getDoc,
  getDocs,
  updateDoc,
  writeBatch,
} from "firebase/firestore";

import { throwErrorToast } from "@/components/toasts/ErrorToast";
import { throwSuccessToast } from "@/components/toasts/SuccessToast";
import { auth, db } from "@/config/firebase";
import { clearQueryCache } from "@/config/query";
import { isTRPCClientError, trpcClient } from "@/config/trpc";
import type {
  ApplicationResponse,
  BoardUserProfile,
  ReviewerUserProfile,
  UserProfile,
} from "@/types/types";

import { appCollection } from "./firestore";

export async function sendVerificationEmail(user: User) {
  try {
    await sendEmailVerification(user);
    throwSuccessToast(`A verification email has been sent to ${user.email}!`);
  } catch (err) {
    throwErrorToast("Failed to send verification email!");
    throw err;
  }
}

export async function registerUser(
  email: string,
  firstName: string,
  lastName: string,
  password: string,
): Promise<UserProfile> {
  try {
    const createdUser = (await trpcClient.auth.register.mutate({
      email,
      password,
      firstName,
      lastName,
    })) as UserProfile;

    const { user } = await signInWithEmailAndPassword(auth, email, password);

    if (!user.emailVerified) {
      console.log("Sending verification email...");
      sendVerificationEmail(user);
    }

    return createdUser;
  } catch (error) {
    if (isTRPCClientError(error)) {
      const errorMessage = `Failed to register: ${error.message}`;
      throwErrorToast(errorMessage);
      throw new Error(errorMessage);
    } else {
      throw error;
    }
  }
}

export async function updateUser(
  email: string,
  firstName: string,
  lastName: string,
): Promise<UserProfile> {
  try {
    if (!auth.currentUser) {
      throw new Error("User must be authenticated to update profile");
    }

    return (await trpcClient.auth.update.mutate({
      email,
      firstName,
      lastName,
    })) as UserProfile;
  } catch (error) {
    if (isTRPCClientError(error)) {
      const errorMessage = `Failed to update user: ${error.message}`;
      throwErrorToast(errorMessage);
      throw new Error(errorMessage);
    } else {
      throw error;
    }
  }
}

export async function loginUser(
  email: string,
  password: string,
): Promise<UserProfile> {
  const res = await signInWithEmailAndPassword(auth, email, password);

  if (!res.user.emailVerified) {
    console.log("Sending verification email...");
    await sendVerificationEmail(res.user);
  }

  return await getUserById(res.user.uid);
}

export async function logoutUser() {
  await signOut(auth);
  await clearQueryCache();
}

export async function getUserById(id: string): Promise<UserProfile> {
  const users = appCollection(FirestoreCollection.Users);
  const userDoc = doc(users, id);

  return (await getDoc(userDoc)).data() as UserProfile;
}

export async function getAllUsers(): Promise<UserProfile[]> {
  const users = appCollection(FirestoreCollection.Users);
  const results = await getDocs(users);

  return results.docs.map((d) => d.data());
}

export async function updateUserRoles(
  users: UserProfile[],
  role: PermissionRole,
) {
  const batch = writeBatch(db);
  const usersCollection = appCollection(FirestoreCollection.Users);

  users.forEach((user) => {
    // if the user is being set to a reviewer, update their role preferences
    // to be all roles if they are not already set
    if (role === PermissionRole.Reviewer) {
      if (!(user as ReviewerUserProfile).applicantRolePreferences) {
        batch.update(doc(usersCollection, user.id), {
          applicantRolePreferences: Object.values(ApplicantRole),
        });
      }
    }

    // if the user is being set to a board, update their role preferences
    // to be [] if they are not already set
    if (role === PermissionRole.Board) {
      if (!(user as BoardUserProfile).applicantRoles) {
        batch.update(doc(usersCollection, user.id), {
          applicantRoles: [],
        });
      }
    }

    batch.update(doc(usersCollection, user.id), {
      role: role,
    });
  });

  await batch.commit();
}

export async function updateUserActiveStatus(
  userId: string,
  inactive: boolean,
) {
  const users = appCollection(FirestoreCollection.Users);
  const userDoc = doc(users, userId);
  await updateDoc(userDoc, {
    inactive: inactive,
  });
}

export async function deleteUsers(userIds: string[]) {
  const batch = writeBatch(db);
  const users = appCollection(FirestoreCollection.Users);

  userIds.forEach((id) => batch.delete(doc(users, id)));

  await batch.commit();
}

export async function setReviewCapableUserRolePreferences(
  reviewerId: string,
  prefs: ApplicantRole[],
) {
  const user = await getUserById(reviewerId);
  if (user.role === PermissionRole.Reviewer) {
    return await setReviewerRolePreferences(reviewerId, prefs);
  } else if (user.role === PermissionRole.Board) {
    return await setBoardApplicantRoles(reviewerId, prefs);
  } else if (user.role === PermissionRole.Applicant) {
    throw new Error("Role preferences cannot be changed for applicants.");
  } else if (user.role === PermissionRole.SuperReviewer) {
    throw new Error("Role preferences cannot be changed for super-reviewers.");
  } else {
    throw new Error("Role preferences cannot be changed for this user.");
  }
}

async function setReviewerRolePreferences(
  reviewerId: string,
  prefs: ApplicantRole[],
) {
  const user = await getUserById(reviewerId);
  if (user.role !== PermissionRole.Reviewer)
    throw new Error("User is not a reviewer!");

  const users = appCollection(FirestoreCollection.Users);
  const userDoc = doc(users, reviewerId);

  const update: Partial<ReviewerUserProfile> = {
    applicantRolePreferences: prefs,
  };

  await updateDoc(userDoc, update);
}

export async function setBoardApplicantRoles(
  boardId: string,
  roles: ApplicantRole[],
) {
  const user = await getUserById(boardId);
  if (user.role !== PermissionRole.Board)
    throw new Error("User is not a board member!");

  const users = appCollection(FirestoreCollection.Users);
  const userDoc = doc(users, boardId);

  const update: Partial<BoardUserProfile> = {
    applicantRoles: roles,
  };

  await updateDoc(userDoc, update);
}

export function onAuthStateChange(
  handler: (userInfo: UserInfo | null) => void,
) {
  return auth.onAuthStateChanged((userInfo) => {
    handler(userInfo);
  });
}

export async function createInternalApplicant(
  firstName: string,
  lastName: string,
  formId: string,
  rolesApplied: ApplicantRole[],
  sectionResponses: SectionResponse[],
): Promise<{ user: UserProfile; applicationResponse: ApplicationResponse }> {
  // both user profile and response; should show name and response ID in confirmation
  const { user, applicationResponse } =
    await trpcClient.auth.createInternalApplicant.mutate({
      firstName,
      lastName,
      formId,
      rolesApplied,
      sectionResponses,
    });
  return { user: user as UserProfile, applicationResponse };
}
