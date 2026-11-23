import { PermissionRole } from "@app-portal/shared/constants";
import { TRPCError } from "@trpc/server";
import { logger } from "firebase-functions";

import type { ApplicationForm } from "../models/appForm";
import type { ApplicationResponse } from "../models/appResponse";
import type { UserProfile } from "../models/user";
import { REVIEW_CAPABLE_ROLES } from "./routers/rows/helpers";

// Mirror the old Firestore rules so moving reads server-side doesn't widen access.
type UserContext = {
  token: { uid: string };
  getUser: () => Promise<UserProfile | undefined>;
};

// The rules' isAuthed() also required the user doc to exist.
export async function requireUser(ctx: UserContext): Promise<UserProfile> {
  const user = await ctx.getUser();
  if (!user) {
    logger.error(`requireUser: User with id ${ctx.token.uid} not found!`);
    throw new TRPCError({ code: "FORBIDDEN" });
  }
  return user;
}

export function isReviewCapableUser(user: UserProfile) {
  return REVIEW_CAPABLE_ROLES.includes(user.role);
}

export function canReadForm(user: UserProfile, form: ApplicationForm) {
  if (isReviewCapableUser(user)) return true;
  if (user.role === PermissionRole.Applicant && !form.isPrivate) return true;
  return form.invitedUsers?.includes(user.id) ?? false;
}

export function assertCanReadForm(user: UserProfile, form: ApplicationForm) {
  if (!canReadForm(user, form)) {
    logger.warn(`User ${user.id} may not read form ${form.id}`);
    throw new TRPCError({ code: "FORBIDDEN" });
  }
}

export function assertCanReadResponse(
  user: UserProfile,
  response: ApplicationResponse,
) {
  if (isReviewCapableUser(user) || response.userId === user.id) return;
  logger.warn(`User ${user.id} may not read response ${response.id}`);
  throw new TRPCError({ code: "FORBIDDEN" });
}
