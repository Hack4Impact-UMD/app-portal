import type { z } from "zod";
import type {
  ApplicationResponseBaseSchema,
  QuestionResponseSchema,
  SectionResponseSchema,
} from "../schemas/response";

export enum ApplicationStatus {
  InProgress = "in-progress",
  Submitted = "submitted",
  UnderReview = "in-review",
  Interview = "interview",
  Decided = "decided",
}

export type QuestionResponse = z.infer<typeof QuestionResponseSchema>;
export type SectionResponse = z.infer<typeof SectionResponseSchema>;
export type ApplicationResponseBase = z.infer<
  typeof ApplicationResponseBaseSchema
>;
