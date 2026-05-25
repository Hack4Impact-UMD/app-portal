import type {
  ApplicantRole,
  PermissionRole,
} from "@app-portal/shared/constants";
import type { ApplicationResponseBase } from "@app-portal/shared/types";
import type { Timestamp } from "firebase/firestore";

export * from "./formBuilderTypes";

export type UserProfile =
  | ApplicantUserProfile
  | ReviewerUserProfile
  | BoardUserProfile
  | SuperReviewerUserProfile;

export type ReviewCapableUser =
  | ReviewerUserProfile
  | BoardUserProfile
  | SuperReviewerUserProfile;

export interface IUserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: PermissionRole;
  dateCreated: Timestamp;
  inactive?: boolean; // optional, true for inactive user. otherwise assumed to be active
}

export interface ApplicantUserProfile extends IUserProfile {
  role: PermissionRole.Applicant;
  activeApplications?: string[];
  inactiveApplications?: string[];
  isInternal?: boolean; // for club members reapplying, will skip to interview
}

export interface ReviewerUserProfile extends IUserProfile {
  role: PermissionRole.Reviewer;
  applicantRolePreferences: ApplicantRole[]; // the roles that this reviewer prefers to review for
}

export interface BoardUserProfile extends IUserProfile {
  role: PermissionRole.Board;
  applicantRoles: ApplicantRole[]; // the roles that this board member adminstrates
}

export interface SuperReviewerUserProfile extends IUserProfile {
  role: PermissionRole.SuperReviewer;
}

// ⚠️ do not edit this type!!!
// edit the ApplicationResponseBaseSchema instead!!!
export interface ApplicationResponse extends ApplicationResponseBase {
  dateSubmitted: Timestamp;
}

export type CsvRow = Record<
  string,
  string | number | boolean | null | undefined
>;
