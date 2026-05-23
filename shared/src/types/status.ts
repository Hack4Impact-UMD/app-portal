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

export const DecisionConfirmationSchema = z.object({
  status: z.enum(["accepted", "denied"]),
  userId: z.string().min(1),
  formId: z.string().min(1),
  responseId: z.string().min(1),
  internalStatusId: z.string().min(1),
});

export type InternalApplicationStatus = z.infer<
  typeof InternalApplicationStatusSchema
>;
export type DecisionConfirmation = z.infer<typeof DecisionConfirmationSchema>;
