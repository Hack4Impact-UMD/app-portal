import type { ApplicantRole } from "@app-portal/shared/constants";
import type { SectionResponse } from "@app-portal/shared/types";
import type { User, UserInfo } from "firebase/auth";
import {
  sendEmailVerification,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";

import { throwErrorToast } from "@/components/toasts/ErrorToast";
import { throwSuccessToast } from "@/components/toasts/SuccessToast";
import { auth } from "@/config/firebase";
import { clearQueryCache } from "@/config/query";
import { isTRPCClientError, trpcClient } from "@/config/trpc";
import type { ApplicationResponse, UserProfile } from "@/types/types";

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

  return (await trpcClient.users.me.query()) as UserProfile;
}

export async function logoutUser() {
  await signOut(auth);
  await clearQueryCache();
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
