import { ApplicantRole, PermissionRole } from "@app-portal/shared/constants";
import type { SectionResponse } from "@app-portal/shared/types";
import axios, { AxiosError } from "axios";
import type { User, UserInfo } from "firebase/auth";
import {
  sendEmailVerification,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  updateDoc,
  where,
  writeBatch,
} from "firebase/firestore";

import { throwErrorToast } from "@/components/toasts/ErrorToast";
import { throwSuccessToast } from "@/components/toasts/SuccessToast";
import { API_URL, auth, db } from "@/config/firebase";
import { clearQueryCache } from "@/config/query";
import type {
  ApplicationResponse,
  BoardUserProfile,
  ReviewerUserProfile,
  UserProfile,
} from "@/types/types";

import { getAppCheckToken } from "./appCheckService";

export const USER_COLLECTION = "users";

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
    const createdUser = (
      await axios.post(
        API_URL + "/auth/register",
        {
          email: email,
          password: password,
          firstName: firstName,
          lastName: lastName,
        },
        {
          headers: {
            "X-APPCHECK": await getAppCheckToken(),
          },
        },
      )
    ).data as UserProfile;

    const { user } = await signInWithEmailAndPassword(auth, email, password);

    if (!user.emailVerified) {
      console.log("Sending verification email...");
      sendVerificationEmail(user);
    }

    return createdUser;
  } catch (error) {
    if (error instanceof AxiosError) {
      const errorMessage = `Failed to register: ${error.message} (${error.response?.data})`;
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
    const token = await auth.currentUser?.getIdToken();
    if (!token) {
      throw new Error("User must be authenticated to update profile");
    }

    const response = await axios.post(
      API_URL + "/auth/update",
      {
        email,
        firstName,
        lastName,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "X-APPCHECK": await getAppCheckToken(),
        },
      },
    );

    return response.data as UserProfile;
  } catch (error) {
    if (error instanceof AxiosError) {
      const errorMessage = `Failed to update user: ${error.message} (${error.response?.data})`;
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
  const users = collection(db, USER_COLLECTION);
  const userDoc = doc(users, id);
  const userData = (await getDoc(userDoc)).data();

  return userData as UserProfile;
}

export async function getUserByEmail(email: string): Promise<UserProfile> {
  const users = collection(db, USER_COLLECTION);
  const q = query(users, where("email", "==", email));

  const results = await getDocs(q);
  if (!results.empty) {
    return results.docs[0].data() as UserProfile;
  } else {
    throw new Error(`User with email ${email} does not exist!`);
  }
}

export async function getAllUsers(): Promise<UserProfile[]> {
  const users = collection(db, USER_COLLECTION);
  const results = await getDocs(users);

  return results.docs.map((d) => d.data() as UserProfile);
}

export async function updateUserRole(userId: string, role: PermissionRole) {
  const users = collection(db, USER_COLLECTION);
  const userDoc = doc(users, userId);
  await updateDoc(userDoc, {
    role: role,
  });
}

export async function updateUserRoles(
  users: UserProfile[],
  role: PermissionRole,
) {
  const batch = writeBatch(db);
  const usersCollection = collection(db, USER_COLLECTION);

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
  const users = collection(db, USER_COLLECTION);
  const userDoc = doc(users, userId);
  await updateDoc(userDoc, {
    inactive: inactive,
  });
}

export async function deleteUsers(userIds: string[]) {
  const batch = writeBatch(db);
  const users = collection(db, USER_COLLECTION);

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

export async function setReviewerRolePreferences(
  reviewerId: string,
  prefs: ApplicantRole[],
) {
  const user = await getUserById(reviewerId);
  if (user.role !== PermissionRole.Reviewer)
    throw new Error("User is not a reviewer!");

  const users = collection(db, USER_COLLECTION);
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

  const users = collection(db, USER_COLLECTION);
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

export function authStateSnapshot() {
  return auth.currentUser;
}

export async function createInternalApplicant(
  firstName: string,
  lastName: string,
  formId: string,
  rolesApplied: ApplicantRole[],
  sectionResponses: SectionResponse[],
  token: string,
): Promise<{ user: UserProfile; applicationResponse: ApplicationResponse }> {
  const appCheckToken = await getAppCheckToken();

  const res = await axios.post(
    API_URL + "/auth/create-internal-applicant",
    {
      firstName,
      lastName,
      formId,
      rolesApplied,
      sectionResponses,
    },
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "X-APPCHECK": appCheckToken,
      },
    },
  );

  // both user profile and response; should show name and response ID in confirmation
  return res.data;
}
