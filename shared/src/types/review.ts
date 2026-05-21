import type { z } from "zod";
import type {
  ReviewRubricQuestionSchema,
  RoleReviewRubricSchema,
} from "../schemas/review";

export type RoleReviewRubric = z.infer<typeof RoleReviewRubricSchema>;
export type ReviewRubricQuestion = z.infer<typeof ReviewRubricQuestionSchema>;
