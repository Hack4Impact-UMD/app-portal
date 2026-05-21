import { z } from "zod";
import { Timestamp } from "firebase-admin/firestore";
import { ReviewStatus } from "./appStatus";
import { ApplicationSectionSchema } from "@app-portal/shared/schemas";
import { ApplicantRole } from "@app-portal/shared/types";

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

export type ApplicationForm = z.infer<typeof ApplicationFormSchema>;
