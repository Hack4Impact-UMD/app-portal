import { Timestamp } from "firebase-admin/firestore";
import { z } from "zod";

// specific application
export enum ApplicantRole {
  Bootcamp = "bootcamp",
  Engineer = "engineer",
  Designer = "designer",
  Product = "product",
  // Sourcing = "sourcing",
  TechLead = "tech-lead",
  SocialMedia = "social-media-manager",
  OutreachCoord = "outreach-coordinator"
}

export enum QuestionType {
  ShortAnswer = "short-answer",
  LongAnswer = "long-answer",
  MultipleChoice = "multiple-choice",
  MultipleSelect = "multiple-select",
  FileUpload = "file-upload",
  RoleSelect = "role-select"
}

export interface QuestionResponse {
  questionType: QuestionType;
  applicationFormId: string;
  questionId: string;
  response: string | string[]
}

export interface SectionResponse {
  sectionId: string;
  questions: QuestionResponse[];
}

export enum ApplicationStatus {
  InProgress = "in-progress",
  Submitted = "submitted",
  UnderReview = "in-review",
  Interview = "interview",
  Decided = "decided",
}
export interface ApplicationResponse {
  id: string;
  userId: string;
  applicationFormId: string;
  rolesApplied: ApplicantRole[];
  sectionResponses: SectionResponse[];
  status: ApplicationStatus;
  dateSubmitted: Timestamp;
  decisionLetterId?: string;
}

export const appResponseFormSchema = z.object({
  applicationFormId: z.string().nonempty("Cant have empty applicationFormId"),
  id: z.string().nonempty("Cant have empty id"),
  userId: z.string().nonempty("Cant have empty userId"),
  rolesApplied: z
    .array(z.enum(ApplicantRole)),
  sectionResponses: z
    .array(
      z.object({
        sectionId: z.string(),
        forRoles: z.array(z.enum(ApplicantRole)).optional(),
        questions: z
          .array(
            z.object({
              applicationFormId: z.string(),
              questionId: z.string(),
              questionType: z.enum(QuestionType),
              response: z.string().or(z.array(z.string())).optional(),
            })
          )
      })
    )
    .nonempty("At least one section must be provided"),
  status: z
    .enum(ApplicationStatus)
    .refine((v) => v === ApplicationStatus.InProgress, {
      message: "Application status must be in progress to submit",
    }),
});

export type AppResponseForm = z.infer<typeof appResponseFormSchema>;

export const QuestionResponseSchema = z.object({
  questionType: z.enum(QuestionType),
  applicationFormId: z.string().nonempty(),
  questionId: z.string().nonempty(),
  response: z.string().or(z.array(z.string()))
})

export const SectionResponseSchema = z.object({
  sectionId: z.string().nonempty(),
  questions: z.array(QuestionResponseSchema),
});

export const ApplicationResponseSchema = z.object({
  id: z.string().nonempty(),
  applicationFormId: z.string().nonempty(),
  rolesApplied: z.array(z.enum(ApplicantRole)),
  sectionResponses: z.array(SectionResponseSchema),
});

export type ApplicationResponseInput = z.infer<typeof ApplicationResponseSchema>;
