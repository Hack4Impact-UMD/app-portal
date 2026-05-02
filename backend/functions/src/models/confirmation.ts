import { z } from "zod";

export const DecisionLetterStatusSchema = z.object({
  status: z.enum(["accepted", "denied"]),
  userId: z.string(),
  formId: z.string(),
  responseId: z.string(),
  internalStatusId: z.string(),
});

export type DecisionLetterStatus = {
  status: "accepted" | "denied";
  userId: string;
  formId: string;
  responseId: string;
  internalStatusId: string;
};
