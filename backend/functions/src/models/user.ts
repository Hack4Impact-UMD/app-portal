import { PermissionRole } from "@app-portal/shared/constants";
import type {
  ApplicantUserProfileBase,
  BoardUserProfileBase,
  ReviewerUserProfileBase,
  SuperReviewerUserProfileBase,
} from "@app-portal/shared/types";
import type { Timestamp } from "firebase-admin/firestore";

type WithDateCreated<T> = T & { dateCreated: Timestamp };

type ApplicantProfile = WithDateCreated<ApplicantUserProfileBase>;
export type ReviewCapableProfile =
  | WithDateCreated<ReviewerUserProfileBase>
  | WithDateCreated<BoardUserProfileBase>
  | WithDateCreated<SuperReviewerUserProfileBase>;
export type UserProfile = ApplicantProfile | ReviewCapableProfile;

export const REVIEW_CAPABLE_ROLES = [
  PermissionRole.Reviewer,
  PermissionRole.SuperReviewer,
  PermissionRole.Board,
];

export function isReviewCapable(
  user: UserProfile,
): user is ReviewCapableProfile {
  return REVIEW_CAPABLE_ROLES.includes(user.role);
}
