import { z } from "zod";
import { ApplicantRole } from "./appResponse";
import { Timestamp } from "firebase-admin/firestore";
import { ReviewStatus } from "./appStatus";

export const ApplicationQuestion = z.object({
  questionId: z.string().nonempty(),
  questionType: z.string().nonempty(),
  optional: z.boolean(),
  questionText: z.string(),
  secondaryText: z.string().optional(),
  minimumWordCount: z.number().optional(),
  maximumWordCount: z.number().optional(),
});

export const ApplicationSectionSchema = z.object({
  sectionName: z.string(),
  sectionId: z.string(),
  forRoles: z.array(z.enum(ApplicantRole)).optional(),
  questions: z.array(ApplicationQuestion),
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
export type ApplicationQuestion = z.infer<typeof ApplicationQuestion>;
