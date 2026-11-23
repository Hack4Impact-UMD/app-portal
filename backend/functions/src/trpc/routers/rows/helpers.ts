import { ApplicantRole, PermissionRole } from "@app-portal/shared/constants";
import { isInternalApplicant } from "@app-portal/shared/utils";
import { TRPCError } from "@trpc/server";
import { logger } from "firebase-functions";

import type { UserProfile } from "../../../models/user";
import { isReviewCapable } from "../../../models/user";

export function scoreWarning(message: string) {
  logger.warn(`Score calculation: ${message}`);
}

export function reviewingFor(user: UserProfile): ApplicantRole[] {
  if (user.role === PermissionRole.Reviewer) {
    return user.applicantRolePreferences ?? [];
  } else if (user.role === PermissionRole.Board) {
    return user.applicantRoles ?? [];
  } else if (user.role === PermissionRole.SuperReviewer) {
    return Object.values(ApplicantRole); // NOTE: dor can review all roles
  }
  return [];
}

export function assignedUserName(
  user: UserProfile | undefined,
  label: "reviewer" | "interviewer",
) {
  if (!user) return "Unknown user";
  const name = `${user.firstName} ${user.lastName}`;
  return isReviewCapable(user)
    ? name
    : `${name} (no longer ${label === "interviewer" ? "an" : "a"} ${label})`;
}

// Rows outlive role changes (an applicant may later become a reviewer), so they
// carry only role-agnostic fields rather than a role-typed profile.
export function userSummary(user: UserProfile) {
  return {
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    isInternal: isInternalApplicant(user),
  };
}

export function requireUser(users: Map<string, UserProfile>, id: string) {
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
