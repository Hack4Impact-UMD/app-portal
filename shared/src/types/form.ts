import { z } from "zod";

import {
  ApplicantRole,
  QuestionType,
  ReviewStatus,
} from "../constants/index.js";

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

export const AssessmentSubmitQuestionSchema = ApplicationQuestionBaseSchema.extend({
  questionType: z.literal(QuestionType.AssessmentSubmit),
  latestJobId: z.string().optional()
});

export const ApplicationQuestionSchema = z.discriminatedUnion("questionType", [
  TextQuestionSchema,
  OptionQuestionSchema,
  FileUploadQuestionSchema,
  RoleSelectQuestionSchema,
  AssessmentSubmitQuestionSchema
]);

export const ApplicationSectionSchema = z.object({
  sectionId: z.string().nonempty(),
  sectionName: z.string().nonempty(),
  description: z.string().optional(),
  forRoles: z.array(z.enum(ApplicantRole)).optional(),
  questions: z.array(ApplicationQuestionSchema),
  hideFromReviewers: z.boolean().optional(),
});

const RoleDecisionLetterSchema = z.object({
  [ApplicantRole.Bootcamp]: z.string(),
  team: z.string(),
});

const DecisionLetterSchema = z.object({
  [ReviewStatus.Accepted]: RoleDecisionLetterSchema,
  [ReviewStatus.Waitlisted]: RoleDecisionLetterSchema,
  [ReviewStatus.Denied]: z.string(),
});

export const ScoreWeightsSchema = z.record(
  z.enum(ApplicantRole),
  z.record(z.string(), z.number().min(0).max(4)),
);

export const ApplicationFormBaseSchema = z.object({
  id: z.string().nonempty(),
  isActive: z.boolean(),
  semester: z.string(),
  description: z.string(),
  sections: z.array(ApplicationSectionSchema),
  decisionsReleased: z.boolean().default(false),
  disabledRoles: z.array(z.enum(ApplicantRole)).optional(),
  decisionLetter: DecisionLetterSchema.optional(),
  scoreWeights: ScoreWeightsSchema,
  interviewScoreWeights: ScoreWeightsSchema,
  assessmentTestRepoPath: z.string().optional(),
});
export type TextQuestion = z.infer<typeof TextQuestionSchema>;
export type OptionQuestion = z.infer<typeof OptionQuestionSchema>;
export type FileUploadQuestion = z.infer<typeof FileUploadQuestionSchema>;
export type RoleSelectQuestion = z.infer<typeof RoleSelectQuestionSchema>;
export type ApplicationQuestion = z.infer<typeof ApplicationQuestionSchema>;
export type ApplicationSection = z.infer<typeof ApplicationSectionSchema>;
export type AssessmentSubmitQuestion = z.infer<typeof AssessmentSubmitQuestionSchema>
export type ApplicationFormBase = z.infer<typeof ApplicationFormBaseSchema>;

