import { z } from "zod";
import { ApplicantRole, ReviewStatus } from "../constants";

export const InternalApplicationStatusSchema = z.object({
  id: z.string().min(1),
  formId: z.string().min(1),
  role: z.enum(ApplicantRole),
  responseId: z.string().min(1),
  status: z.enum(ReviewStatus),
  isQualified: z.boolean(),
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

export type InternalApplicationStatus = z.infer<
  typeof InternalApplicationStatusSchema
>;
export type RoleReviewRubric = z.infer<typeof RoleReviewRubricSchema>;
export type ReviewRubricQuestion = z.infer<typeof ReviewRubricQuestionSchema>;
