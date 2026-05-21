import { z } from "zod";
import { ApplicantRole, QuestionType } from "../constants";

export const ApplicationQuestionBaseSchema = z.object({
  questionId: z.string().nonempty(),
  optional: z.boolean(),
  questionText: z.string(),
  secondaryText: z.string().optional(),
});

export const TextQuestionSchema = ApplicationQuestionBaseSchema.extend({
  questionType: z.enum([QuestionType.ShortAnswer, QuestionType.LongAnswer]),
  placeholderText: z.string(),
  minimumWordCount: z.number().optional(),
  maximumWordCount: z.number().optional(),
});

export const OptionQuestionSchema = ApplicationQuestionBaseSchema.extend({
  questionType: z.enum([
    QuestionType.MultipleChoice,
    QuestionType.MultipleSelect,
  ]),
  questionOptions: z.array(z.string()),
});

export const FileUploadQuestionSchema = ApplicationQuestionBaseSchema.extend({
  questionType: z.literal(QuestionType.FileUpload),
  fileId: z.string(),
});

export const RoleSelectQuestionSchema = ApplicationQuestionBaseSchema.extend({
  questionType: z.literal(QuestionType.RoleSelect),
});

export const ApplicationQuestionSchema = z.discriminatedUnion("questionType", [
  TextQuestionSchema,
  OptionQuestionSchema,
  FileUploadQuestionSchema,
  RoleSelectQuestionSchema,
]);

export const ApplicationSectionSchema = z.object({
  sectionId: z.string().nonempty(),
  sectionName: z.string().nonempty(),
  description: z.string().optional(),
  forRoles: z.array(z.enum(ApplicantRole)).optional(),
  questions: z.array(ApplicationQuestionSchema),
  hideFromReviewers: z.boolean().optional(),
});

export type TextQuestion = z.infer<typeof TextQuestionSchema>;
export type OptionQuestion = z.infer<typeof OptionQuestionSchema>;
export type FileUploadQuestion = z.infer<typeof FileUploadQuestionSchema>;
export type RoleSelectQuestion = z.infer<typeof RoleSelectQuestionSchema>;
export type ApplicationQuestion = z.infer<typeof ApplicationQuestionSchema>;
export type ApplicationSection = z.infer<typeof ApplicationSectionSchema>;
