import type {
  ApplicantUserProfileBase,
  ApplicationFormBase,
  ApplicationResponseBase,
  BoardUserProfileBase,
  GradingJobPublicBase,
  ReviewerUserProfileBase,
  SuperReviewerUserProfileBase,
  TimestampLike,
} from "@app-portal/shared/types";
import type { Timestamp } from "firebase/firestore";

// ⚠️ do not edit these types!!!!
// edit the base schemas within @app-portal/shared instead!!!!

type ProfileWithClientTimestamp<T> = T & { dateCreated: TimestampLike };

export type ApplicantUserProfile =
  ProfileWithClientTimestamp<ApplicantUserProfileBase>;

export type ReviewerUserProfile =
  ProfileWithClientTimestamp<ReviewerUserProfileBase>;

export type BoardUserProfile = ProfileWithClientTimestamp<BoardUserProfileBase>;

type SuperReviewerUserProfile =
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
  dateSubmitted: TimestampLike;
}

export interface ApplicationForm extends ApplicationFormBase {
  dueDate: TimestampLike;
}

export interface GradingJobPublic extends GradingJobPublicBase {
  started: Timestamp;
  completed?: Timestamp;
  updated: Timestamp;
}

export type CsvRow = Record<
  string,
  string | number | boolean | null | undefined
>;
