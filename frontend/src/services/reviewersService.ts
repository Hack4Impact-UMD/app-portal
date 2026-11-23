import { ApplicantRole, PermissionRole } from "@app-portal/shared/constants";

import type { ReviewCapableUser } from "@/types/types";

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
