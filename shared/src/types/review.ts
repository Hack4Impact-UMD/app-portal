import { z } from "zod";

import { ApplicantRole } from "../constants/index.js";

export const AssignmentBaseSchema = z.object({
  id: z.string().min(1),
  formId: z.string().min(1),
  applicantId: z.string().min(1),
  applicationResponseId: z.string().min(1),
  forRole: z.enum(ApplicantRole),
});

export const ReviewAssignmentSchema = AssignmentBaseSchema.extend({
  assignmentType: z.literal("review"),
  reviewerId: z.string().min(1),
});

export const InterviewAssignmentSchema = AssignmentBaseSchema.extend({
  assignmentType: z.literal("interview"),
  interviewerId: z.string().min(1),
});

export const ReviewDataBaseSchema = z.object({
  id: z.string().nonempty(),
  applicationFormId: z.string().nonempty(),
  applicationResponseId: z.string().nonempty(),
  applicantId: z.string().nonempty(),
  forRole: z.enum(ApplicantRole),
  submitted: z.boolean(),
});

export const ApplicationReviewDataSchema = ReviewDataBaseSchema.extend({
  reviewerId: z.string().nonempty(),
  applicantScores: z.record(z.string().nonempty(), z.number().min(0)),
  reviewerNotes: z.record(z.string().nonempty(), z.string()),
});

export const ApplicationInterviewDataSchema = ReviewDataBaseSchema.extend({
  interviewerId: z.string().nonempty(),
  interviewScores: z.record(z.string().nonempty(), z.number().min(0)),
  interviewerNotes: z.record(z.string().nonempty(), z.string()),
});

export const ReviewRubricQuestionSchema = z
  .object({
    scoreKey: z.string().min(1),
    prompt: z.string().min(1),
    description: z.string().optional(),
    maxValue: z.number().int().min(0).max(10).optional(),
    minValue: z.number().int().min(0).max(10).optional(),
  })
  .refine(
    (q) =>
      q.maxValue === undefined ||
      q.minValue === undefined ||
      q.maxValue >= q.minValue,
    { message: "maxValue must be >= minValue" },
  );

export const RoleReviewRubricSchema = z
  .object({
    id: z.string().min(1),
    formId: z.string().min(1),
    roles: z.array(z.enum(ApplicantRole)),
    rubricQuestions: z.array(ReviewRubricQuestionSchema).min(1),
    detailLink: z.url().optional(),
    commentsDescription: z.string().optional(),
  })
  .superRefine((rubric, ctx) => {
    const seen = new Set<string>();
    for (const [idx, q] of rubric.rubricQuestions.entries()) {
      if (seen.has(q.scoreKey)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["rubricQuestions", idx, "scoreKey"],
          message: `Duplicate scoreKey "${q.scoreKey}" in rubric "${rubric.id}"`,
        });
      }
      seen.add(q.scoreKey);
    }
  });

export type AppReviewAssignment = z.infer<typeof ReviewAssignmentSchema>;
export type InterviewAssignment = z.infer<typeof InterviewAssignmentSchema>;
export type ApplicationReviewData = z.infer<typeof ApplicationReviewDataSchema>;
export type ApplicationInterviewData = z.infer<
  typeof ApplicationInterviewDataSchema
>;
export type RoleReviewRubric = z.infer<typeof RoleReviewRubricSchema>;
export type ReviewRubricQuestion = z.infer<typeof ReviewRubricQuestionSchema>;
