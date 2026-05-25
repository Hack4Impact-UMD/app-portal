import type {
  ApplicantUserProfileBase,
  ApplicationFormBase,
  ApplicationResponseBase,
  BoardUserProfileBase,
  ReviewerUserProfileBase,
  SuperReviewerUserProfileBase,
} from "@app-portal/shared/types";
import type { Timestamp } from "firebase/firestore";

// ⚠️ do not edit these types!!!!
// edit the base schemas within @app-portal/shared instead!!!!

type ProfileWithClientTimestamp<T> = T & { dateCreated: Timestamp };

export type ApplicantUserProfile =
  ProfileWithClientTimestamp<ApplicantUserProfileBase>;

export type ReviewerUserProfile =
  ProfileWithClientTimestamp<ReviewerUserProfileBase>;

export type BoardUserProfile = ProfileWithClientTimestamp<BoardUserProfileBase>;

export type SuperReviewerUserProfile =
  ProfileWithClientTimestamp<SuperReviewerUserProfileBase>;

export type UserProfile =
  | ApplicantUserProfile
  | ReviewerUserProfile
  | BoardUserProfile
  | SuperReviewerUserProfile;

export type ReviewCapableUser =
  | ReviewerUserProfile
  | BoardUserProfile
  | SuperReviewerUserProfile;

export interface ApplicationResponse extends ApplicationResponseBase {
  dateSubmitted: Timestamp;
}

export interface ApplicationForm extends ApplicationFormBase {
  dueDate: Timestamp;
}

export type CsvRow = Record<
  string,
  string | number | boolean | null | undefined
>;
