import type { z } from "zod";
import type {
  ApplicationQuestionSchema,
  ApplicationSectionSchema,
  FileUploadQuestionSchema,
  OptionQuestionSchema,
  RoleSelectQuestionSchema,
  TextQuestionSchema,
} from "../schemas";

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

export type TextQuestion = z.infer<typeof TextQuestionSchema>;
export type OptionQuestion = z.infer<typeof OptionQuestionSchema>;
export type FileUploadQuestion = z.infer<typeof FileUploadQuestionSchema>;
export type RoleSelectQuestion = z.infer<typeof RoleSelectQuestionSchema>;
export type ApplicationQuestion = z.infer<typeof ApplicationQuestionSchema>;
export type ApplicationSection = z.infer<typeof ApplicationSectionSchema>;
