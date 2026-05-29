import { ApplicationFormBaseSchema } from "@app-portal/shared/types";
import type { ApplicationFormBase } from "@app-portal/shared/types";
import { Timestamp } from "firebase-admin/firestore";
import { z } from "zod";

// ⚠️ do not edit this type!!!
// edit the ApplicationFormBaseSchema in shared instead!!!
export const ApplicationFormSchema = ApplicationFormBaseSchema.extend({
  dateSubmitted: z.custom<Timestamp>((d) => d instanceof Timestamp),
});

export interface ApplicationForm extends ApplicationFormBase {
  dueDate: Timestamp;
}
