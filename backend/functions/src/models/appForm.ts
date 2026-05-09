import { z } from "zod";
import { ApplicantRole, QuestionType } from "./appResponse";
import { Timestamp } from "firebase-admin/firestore";
import { ReviewStatus } from "./appStatus";

const ApplicationQuestionBaseSchema = z.object({
  questionId: z.string().nonempty(),
  optional: z.boolean(),
  questionText: z.string(),
  secondaryText: z.string().optional(),
});

const TextQuestionSchema = ApplicationQuestionBaseSchema.extend({
  questionType: z.enum([QuestionType.ShortAnswer, QuestionType.LongAnswer]),
  placeholderText: z.string(),
  minimumWordCount: z.number().optional(),
  maximumWordCount: z.number().optional(),
});

const OptionQuestionSchema = ApplicationQuestionBaseSchema.extend({
  questionType: z.enum([
    QuestionType.MultipleChoice,
    QuestionType.MultipleSelect,
  ]),
  multipleSelect: z.boolean(),
  questionOptions: z.array(z.string()),
});

const FileUploadQuestionSchema = ApplicationQuestionBaseSchema.extend({
  questionType: z.literal(QuestionType.FileUpload),
  fileId: z.string(),
});

const RoleSelectQuestionSchema = ApplicationQuestionBaseSchema.extend({
  questionType: z.literal(QuestionType.RoleSelect),
});

export const ApplicationQuestionSchema = z.discriminatedUnion("questionType", [
  TextQuestionSchema,
  OptionQuestionSchema,
  FileUploadQuestionSchema,
  RoleSelectQuestionSchema,
]);

export const ApplicationSectionSchema = z.object({
  sectionName: z.string(),
  sectionId: z.string(),
  forRoles: z.array(z.enum(ApplicantRole)).optional(),
  questions: z.array(ApplicationQuestionSchema),
});

const RoleDecisionLetterSchema = z.object({
  [ApplicantRole.Bootcamp]: z.string(),
  team: z.string(),
});

export const DecisionLetterSchema = z.object({
  [ReviewStatus.Accepted]: RoleDecisionLetterSchema,
  [ReviewStatus.Waitlisted]: RoleDecisionLetterSchema,
  [ReviewStatus.Denied]: z.string(),
});

export const ScoreWeightsSchema = z.record(
  z.enum(ApplicantRole),
  z.record(z.string(), z.number().min(0).max(4)),
);

export const ApplicationFormSchema = z.object({
  id: z.string().nonempty(),
  isActive: z.boolean(),
  dueDate: z.custom<Timestamp>((d) => d instanceof Timestamp),
  semester: z.string(),
  description: z.string(),
  sections: z.array(ApplicationSectionSchema),
  decisionsReleased: z.boolean().default(false),
  disabledRoles: z.array(z.enum(ApplicantRole)).optional(),
  decisionLetter: DecisionLetterSchema.optional(),
  scoreWeights: ScoreWeightsSchema,
  interviewScoreWeights: ScoreWeightsSchema,
});

export type ApplicationSection = z.infer<typeof ApplicationSectionSchema>;
export type ApplicationForm = z.infer<typeof ApplicationFormSchema>;
export type ApplicationQuestion = z.infer<typeof ApplicationQuestionSchema>;
