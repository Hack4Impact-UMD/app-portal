import { ApplicantRole } from "./appResponse";

export enum ReviewStatus {
  NotReviewed = "not-reviewed",
  UnderReview = "under-review",
  Reviewed = "reviewed",
  Interview = "interview",
  Accepted = "accepted",
  Denied = "denied",
  Waitlisted = "waitlist",
}

export type InternalApplicationStatus = {
  id: string;
  formId: string;
  role: ApplicantRole;
  responseId: string;
  status: ReviewStatus;
  isQualified: boolean;
};
