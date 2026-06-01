export enum FirestoreCollection {
  Users = "users",
  ApplicationForms = "application-forms",
  ApplicationResponses = "application-responses",
  ApplicationStatus = "app-status",
  DecisionStatus = "decision-status",
  Rubrics = "rubrics",
  InterviewRubrics = "interview-rubrics",
  ReviewData = "review-data",
  InterviewData = "interview-data",
  ReviewAssignments = "review-assignments",
  InterviewAssignments = "interview-assignments",
  GradingJobsPublic = "grading-jobs-public",
  GradingJobsInternal = "grading-jobs-internal",
}

export enum PermissionRole {
  SuperReviewer = "super-reviewer",
  Reviewer = "reviewer",
  Board = "board",
  Applicant = "applicant",
}

export enum ApplicantRole {
  Bootcamp = "bootcamp",
  Engineer = "engineer",
  Designer = "designer",
  Product = "product",
  // Sourcing = "sourcing", // legacy value that still exists in prod acc
  TechLead = "tech-lead",
  SocialMedia = "social-media-manager",
  OutreachCoord = "outreach-coordinator",
}

export enum QuestionType {
  ShortAnswer = "short-answer",
  LongAnswer = "long-answer",
  MultipleChoice = "multiple-choice",
  MultipleSelect = "multiple-select",
  FileUpload = "file-upload",
  RoleSelect = "role-select",
}

export enum ApplicationStatus {
  InProgress = "in-progress",
  Submitted = "submitted",
  UnderReview = "in-review",
  Interview = "interview",
  Decided = "decided",
}

export enum ReviewStatus {
  NotReviewed = "not-reviewed",
  UnderReview = "under-review",
  Reviewed = "reviewed",
  Interview = "interview",
  Accepted = "accepted",
  Denied = "denied",
  Waitlisted = "waitlist",
}
