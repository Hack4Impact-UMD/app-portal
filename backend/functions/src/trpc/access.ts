import type { ApplicantRole } from "@app-portal/shared/constants";
import { PermissionRole } from "@app-portal/shared/constants";

import type { ApplicationForm } from "../models/appForm";
import type { ApplicationResponse } from "../models/appResponse";
import type { UserProfile } from "../models/user";
import { isReviewCapable } from "../models/user";

// Mirror the old Firestore rules so moving reads server-side doesn't widen access.

export function canReadForm(user: UserProfile, form: ApplicationForm) {
  if (isReviewCapable(user)) return true;
  if (user.role === PermissionRole.Applicant && !form.isPrivate) return true;
  return form.invitedUsers?.includes(user.id) ?? false;
}

// Plain reviewers may only read responses they're assigned to review or
// interview.
export function canReadResponse(
  user: UserProfile,
  response: ApplicationResponse,
  isAssigned: boolean,
) {
  return (
    isBoardOrAbove(user) ||
    (isReviewCapable(user) && isAssigned) ||
    response.userId === user.id
  );
}

export function canReadUser(user: UserProfile, targetId: string) {
  return targetId === user.id || isReviewCapable(user);
}

export function isBoardOrAbove(user: UserProfile) {
  return (
    user.role === PermissionRole.Board ||
    user.role === PermissionRole.SuperReviewer
  );
}

// Review/interview data and assignments belong to the assigned user.
export function canReadAssignedData(user: UserProfile, assigneeId?: string) {
  return isBoardOrAbove(user) || assigneeId === user.id;
}

// Super-reviewers can't manage interview assignments, matching the old rules.
export function managesInterviewRole(user: UserProfile, role: ApplicantRole) {
  return (
    user.role === PermissionRole.Board &&
    (user.applicantRoles?.includes(role) ?? false)
  );
}

// Private forms can invite users of any role. `formId` is undefined only when
// there's no response yet and the caller supplied none; `form` is undefined
// when the ID doesn't resolve, which must not count as a public form (mirrors
// the rules' exists() guard).
export function canRespondToForm(
  user: UserProfile,
  formId: string | undefined,
  form: ApplicationForm | undefined,
) {
  if (!formId) return user.role === PermissionRole.Applicant;
  if (form && user.role === PermissionRole.Applicant && !form.isPrivate) {
    return true;
  }
  return form?.invitedUsers?.includes(user.id) ?? false;
}

// Reviewers and board members may edit their own role preferences;
// super-reviewers may edit anyone's.
export function canEditRolePreferences(user: UserProfile, targetId: string) {
  return user.role === PermissionRole.SuperReviewer || user.id === targetId;
}

export function canSubmitGrading(
  user: UserProfile,
  response: ApplicationResponse,
) {
  return response.userId === user.id || isBoardOrAbove(user);
}
