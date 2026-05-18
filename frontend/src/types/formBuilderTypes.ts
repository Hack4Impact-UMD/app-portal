import { Timestamp } from "firebase/firestore";
import { ReviewStatus } from "./types";

export enum ApplicantRole {
  Bootcamp = "bootcamp",
  Engineer = "engineer",
  Designer = "designer",
  Product = "product",
  // Sourcing = "sourcing",
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

// stores data about the content of the application forms
export interface ApplicationForm {
  id: string;
  isActive: boolean;
  dueDate: Timestamp;
  semester: string;
  description: string;
  sections: ApplicationSection[];
  decisionsReleased: boolean;
  disabledRoles?: ApplicantRole[]; // list of disabled roles
  decisionLetter?: {
    // decision letters split like this by Board at time of writing, but can be changed easily
    [ReviewStatus.Accepted]: {
      [role in ApplicantRole.Bootcamp | "team"]: string;
    };
    [ReviewStatus.Denied]: string;
    [ReviewStatus.Waitlisted]: {
      [role in ApplicantRole.Bootcamp | "team"]: string;
    };
  };
  scoreWeights: {
    [role in ApplicantRole]: {
      [score in string]: number; // weight for role + score category, between 0-4
    };
  };
  interviewScoreWeights: {
    [role in ApplicantRole]: {
      [score in string]: number; // weight for role + score category, between 0-4
    };
  };
}

export interface ApplicationSection {
  sectionId: string; //no spaces, alphanumeric, unique (used as a route param)
  sectionName: string;
  description?: string;
  forRoles?: ApplicantRole[]; // some sections are role specific
  questions: ApplicationQuestion[];
  hideFromReviewers?: boolean;
}

export interface IApplicationQuestion {
  questionId: string;
  questionType: QuestionType;
  optional: boolean;
  questionText: string;
  secondaryText?: string;
}

export interface TextQuestion extends IApplicationQuestion {
  questionType: QuestionType.ShortAnswer | QuestionType.LongAnswer;
  placeholderText: string;
  maximumWordCount?: number;
  minimumWordCount?: number;
}

export interface OptionQuestion extends IApplicationQuestion {
  questionType: QuestionType.MultipleChoice | QuestionType.MultipleSelect;
  questionOptions: string[];
}

export interface FileUploadQuestion extends IApplicationQuestion {
  questionType: QuestionType.FileUpload;
  fileId: string;
}

export interface RoleSelectQuestion extends IApplicationQuestion {
  questionType: QuestionType.RoleSelect;
}

//helps with automatic type inference based on the questionType field
export type ApplicationQuestion =
  | TextQuestion
  | OptionQuestion
  | FileUploadQuestion
  | RoleSelectQuestion;
