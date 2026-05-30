import { ApplicationResponseBaseSchema } from "@app-portal/shared/types";
import { Timestamp } from "firebase-admin/firestore";
import { z } from "zod";

// ⚠️ do not edit this type!!!
// edit the ApplicationResponseBaseSchema instead!!!
const ApplicationResponseSchema = ApplicationResponseBaseSchema.extend({
  dateSubmitted: z.custom<Timestamp>((d) => d instanceof Timestamp),
});

export type ApplicationResponse = z.infer<typeof ApplicationResponseSchema>;
