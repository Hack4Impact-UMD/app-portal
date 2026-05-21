import { ApplicantRole } from "@app-portal/shared/constants";
import { db } from "@/config/firebase";
import type { ReviewCapableUser, UserProfile } from "@/types/types";
import { PermissionRole } from "@/types/types";
import { and, collection, getDocs, or, query, where } from "firebase/firestore";
import { getUserById } from "./userService";

const USERS_COLLECTION = "users";
const REVIEW_CAPABLE_ROLES = [
  PermissionRole.Reviewer,
  PermissionRole.SuperReviewer,
  PermissionRole.Board,
];

export async function getReviewerById(id: string): Promise<ReviewCapableUser> {
  const user = await getUserById(id);
  if (REVIEW_CAPABLE_ROLES.includes(user.role)) {
    return user as ReviewCapableUser;
  } else {
    throw new Error("User is not review capable");
  }
}

export async function getRolePreferencesForReviewer(
  reviewerId: string,
): Promise<ApplicantRole[]> {
  const user = await getUserById(reviewerId);
  if (REVIEW_CAPABLE_ROLES.includes(user.role)) {
    return reviewingFor(user as ReviewCapableUser);
  } else {
    throw new Error("User is not review capable");
  }
}

export async function getAllReviewers(): Promise<ReviewCapableUser[]> {
  const users = collection(db, USERS_COLLECTION);
  const q = query(users, where("role", "in", REVIEW_CAPABLE_ROLES));

  // NOTE: for some reason, if the inactive field does not exist, querying on it never matches. we need to filter here instead.
  return (await getDocs(q)).docs
    .map((d) => d.data() as ReviewCapableUser)
    .filter((r) => !r.inactive);
}

export async function getReviewersForRole(
  role: ApplicantRole,
): Promise<ReviewCapableUser[]> {
  const users = collection(db, USERS_COLLECTION);
  const q = query(
    users,
    and(
      where("role", "in", REVIEW_CAPABLE_ROLES),
      or(
        where("applicantRolePreferences", "array-contains", role),
        where("applicantRoles", "array-contains", role),
        where("role", "==", PermissionRole.SuperReviewer),
      ),
    ),
  );
  // NOTE: for some reason, if the inactive field does not exist, querying on it never matches. we need to filter here instead.
  return (await getDocs(q)).docs
    .map((d) => d.data() as ReviewCapableUser)
    .filter((r) => !r.inactive);
}

export function reviewingFor(user: ReviewCapableUser) {
  if (user.role === PermissionRole.Reviewer) {
    return user.applicantRolePreferences ?? [];
  } else if (user.role === PermissionRole.Board) {
    return user.applicantRoles ?? [];
  } else if (user.role === PermissionRole.SuperReviewer) {
    return Object.values(ApplicantRole); //NOTE: dor can review all roles
  } else {
    return [];
  }
}

export function reviewCapable(user: UserProfile): user is ReviewCapableUser {
  return REVIEW_CAPABLE_ROLES.includes(user.role);
}
