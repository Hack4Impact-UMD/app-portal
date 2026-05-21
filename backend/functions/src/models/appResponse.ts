import { ApplicantRole, QuestionType } from "@app-portal/shared/types";
import { Timestamp } from "firebase-admin/firestore";
import { z } from "zod";

export enum ApplicationStatus {
  InProgress = "in-progress",
  Submitted = "submitted",
  UnderReview = "in-review",
  Interview = "interview",
  Decided = "decided",
}

export const QuestionResponseSchema = z.object({
  questionType: z.enum(QuestionType),
  applicationFormId: z.string().nonempty(),
  questionId: z.string().nonempty(),
  response: z.string().or(z.array(z.string())),
});

export type QuestionResponse = z.infer<typeof QuestionResponseSchema>;

export const SectionResponseSchema = z.object({
  sectionId: z.string().nonempty(),
  sectionName: z.string().nonempty(),
  questions: z.array(QuestionResponseSchema),
});

export type SectionResponse = z.infer<typeof SectionResponseSchema>;

export const ApplicationResponseSchema = z.object({
  id: z.string().nonempty("Cannot have empty response ID"),
  userId: z.string().nonempty("Cannot have empty user ID"),
  applicationFormId: z
    .string()
    .nonempty("Cannot have empty application form ID"),
  rolesApplied: z.array(z.enum(ApplicantRole)),
  sectionResponses: z
    .array(SectionResponseSchema)
    .nonempty("Must submit at least one section response"),
  status: z.enum(ApplicationStatus),
  dateSubmitted: z.custom<Timestamp>((d) => d instanceof Timestamp),
});

export type ApplicationResponse = z.infer<typeof ApplicationResponseSchema>;

export const ApplicationResponseSubmitRequestSchema =
  ApplicationResponseSchema.omit({ dateSubmitted: true }).extend({
    rolesApplied: z
      .array(z.enum(ApplicantRole))
      .nonempty("Must submit at least one role"),
    status: z
      .enum(ApplicationStatus)
      .refine((v) => v === ApplicationStatus.InProgress, {
        message: "Application status must be in progress to submit",
      }),
  });

export type ApplicationResponseSubmitRequest = z.infer<
  typeof ApplicationResponseSubmitRequestSchema
>;

export const ApplicationResponseSaveRequestSchema =
  ApplicationResponseSchema.pick({
    id: true,
    applicationFormId: true,
    rolesApplied: true,
    sectionResponses: true,
  });

export type ApplicationResponseSaveRequest = z.infer<
  typeof ApplicationResponseSaveRequestSchema
>;
