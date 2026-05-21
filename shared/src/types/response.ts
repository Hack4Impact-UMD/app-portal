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

export type QuestionResponse = z.infer<typeof QuestionResponseSchema>;
export type SectionResponse = z.infer<typeof SectionResponseSchema>;
export type ApplicationResponseBase = z.infer<
  typeof ApplicationResponseBaseSchema
>;
