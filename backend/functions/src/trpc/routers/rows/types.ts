import type { ApplicantRole } from "@app-portal/shared/constants";
import type {
  ApplicantUserProfileBase,
  BoardUserProfileBase,
  ReviewerUserProfileBase,
  SuperReviewerUserProfileBase,
} from "@app-portal/shared/types";
import type { Timestamp } from "firebase-admin/firestore";

import type { UserProfile } from "../../../models/user";

export type AnyUserProfile = UserProfile & {
  applicantRoles?: ApplicantRole[];
  applicantRolePreferences?: ApplicantRole[];
};

type WithDateCreated<T> = T & { dateCreated: Timestamp };
export type ApplicantProfile = WithDateCreated<ApplicantUserProfileBase>;
export type ReviewCapableProfile =
  | WithDateCreated<ReviewerUserProfileBase>
  | WithDateCreated<BoardUserProfileBase>
  | WithDateCreated<SuperReviewerUserProfileBase>;
