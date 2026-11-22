import { ApplicantRole, PermissionRole } from "@app-portal/shared/constants";
import { TRPCError } from "@trpc/server";
import { logger } from "firebase-functions";

import type { AnyUserProfile, ReviewCapableProfile } from "./types";

export const REVIEW_CAPABLE_ROLES = [
  PermissionRole.Reviewer,
  PermissionRole.SuperReviewer,
  PermissionRole.Board,
];

export function scoreWarning(message: string) {
  logger.warn(`Score calculation: ${message}`);
}

export function reviewingFor(user: AnyUserProfile): ApplicantRole[] {
  if (user.role === PermissionRole.Reviewer) {
    return user.applicantRolePreferences ?? [];
  } else if (user.role === PermissionRole.Board) {
    return user.applicantRoles ?? [];
  } else if (user.role === PermissionRole.SuperReviewer) {
    return Object.values(ApplicantRole); // NOTE: dor can review all roles
  }
  return [];
}

export function isReviewCapable(
  user: AnyUserProfile,
): user is AnyUserProfile & ReviewCapableProfile {
  return REVIEW_CAPABLE_ROLES.includes(user.role);
}

export function assignedUserName(
  user: AnyUserProfile | undefined,
  label: "reviewer" | "interviewer",
) {
  if (!user) return "Unknown user";
  const name = `${user.firstName} ${user.lastName}`;
  return isReviewCapable(user)
    ? name
    : `${name} (no longer ${label === "interviewer" ? "an" : "a"} ${label})`;
}

export function requireUser(users: Map<string, AnyUserProfile>, id: string) {
  const user = users.get(id);
  if (!user) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: `User ${id} not found`,
    });
  }
  return user;
}

export function firstByApplicantRole<
  T extends { applicantId: string; forRole: ApplicantRole },
>(items: T[]) {
  const byKey = new Map<string, T>();
  for (const item of items) {
    const key = `${item.applicantId}:${item.forRole}`;
    if (!byKey.has(key)) byKey.set(key, item);
  }
  return byKey;
}
