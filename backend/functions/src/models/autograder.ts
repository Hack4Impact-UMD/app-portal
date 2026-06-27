import { GradingJobPublicBaseSchema } from "@app-portal/shared/types";
import { Timestamp } from "firebase-admin/firestore";
import { z } from "zod";

// ⚠️ do not edit this type!!!
// edit the GradingJobPublicBaseSchema instead!!!
const GradingJobPublicSchema = GradingJobPublicBaseSchema.extend({
  started: z.custom<Timestamp>((d) => d instanceof Timestamp),
  completed: z.custom<Timestamp>((d) => d instanceof Timestamp).optional(),
  updated: z.custom<Timestamp>((d) => d instanceof Timestamp),
});

export type GradingJobPublic = z.infer<typeof GradingJobPublicSchema>;
