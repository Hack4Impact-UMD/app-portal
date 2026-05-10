import { z } from "zod";
import { ApplicantRole } from "./appResponse";

export const reviewRubricQuestionSchema = z
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

export const roleReviewRubricSchema = z
  .object({
    id: z.string().min(1),
    formId: z.string().min(1),
    roles: z.array(z.enum(ApplicantRole)),
    rubricQuestions: z.array(reviewRubricQuestionSchema).min(1),
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

export type RoleReviewRubric = z.infer<typeof roleReviewRubricSchema>;
export type ReviewRubricQuestion = z.infer<typeof reviewRubricQuestionSchema>;
