import { ApplicationFormBaseSchema } from "@app-portal/shared/types";
import { Timestamp } from "firebase-admin/firestore";
import { z } from "zod";

// ⚠️ do not edit this type!!!
// edit the ApplicationFormBaseSchema in shared instead!!!
const ApplicationFormSchema = ApplicationFormBaseSchema.extend({
  dueDate: z.custom<Timestamp>((d) => d instanceof Timestamp),
});

export type ApplicationForm = z.infer<typeof ApplicationFormSchema>;
