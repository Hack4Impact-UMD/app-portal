import { z } from "zod";

import { ApplicantRole, ApplicationStatus, QuestionType } from "../constants";

export const QuestionResponseSchema = z.object({
  questionType: z.enum(QuestionType),
  applicationFormId: z.string().nonempty(),
  questionId: z.string().nonempty(),
  response: z.string().or(z.array(z.string())),
});

export const SectionResponseSchema = z.object({
  sectionId: z.string().nonempty(),
  sectionName: z.string().nonempty(),
  questions: z.array(QuestionResponseSchema),
});

// ⚠️ should not be used on its own!!!!
// use the per-package extension schema with Timestamp!!!!
export const ApplicationResponseBaseSchema = z.object({
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
});

export const ApplicationResponseSubmitRequestSchema =
  ApplicationResponseBaseSchema.extend({
    rolesApplied: z
      .array(z.enum(ApplicantRole))
      .nonempty("Must submit at least one role"),
    status: z
      .enum(ApplicationStatus)
      .refine((v) => v === ApplicationStatus.InProgress, {
        message: "Application status must be in progress to submit",
      }),
  });

export const ApplicationResponseSaveRequestSchema =
  ApplicationResponseBaseSchema.pick({
    id: true,
    applicationFormId: true,
    rolesApplied: true,
    sectionResponses: true,
  });

export const ValidationErrorSchema = z.object({
  sectionId: z.string().min(1),
  questionId: z.string().min(1),
  message: z.string().min(1),
});

export type QuestionResponse = z.infer<typeof QuestionResponseSchema>;
export type SectionResponse = z.infer<typeof SectionResponseSchema>;
export type ApplicationResponseBase = z.infer<
  typeof ApplicationResponseBaseSchema
>;
export type ApplicationResponseSubmitRequest = z.infer<
  typeof ApplicationResponseSubmitRequestSchema
>;
export type ApplicationResponseSaveRequest = z.infer<
  typeof ApplicationResponseSaveRequestSchema
>;
export type ValidationError = z.infer<typeof ValidationErrorSchema>;
