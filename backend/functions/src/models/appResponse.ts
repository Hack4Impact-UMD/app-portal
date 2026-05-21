import { ApplicationResponseBaseSchema } from "@app-portal/shared/types";
import { ApplicantRole, ApplicationStatus } from "@app-portal/shared/constants";
import { Timestamp } from "firebase-admin/firestore";
import { z } from "zod";

// ⚠️ do not edit this type!!!
// edit the ApplicationResponseBaseSchema instead!!!
export const ApplicationResponseSchema = ApplicationResponseBaseSchema.extend({
  dateSubmitted: z.custom<Timestamp>((d) => d instanceof Timestamp),
});

export type ApplicationResponse = z.infer<typeof ApplicationResponseSchema>;

export const ApplicationResponseSubmitRequestSchema =
  ApplicationResponseSchema.omit({ dateSubmitted: true }).extend({
    rolesApplied: z
      .array(z.enum(ApplicantRole))
      .nonempty("Must submit at least one role"),
    status: z
      .enum(ApplicationStatus)
      .refine((v) => v === ApplicationStatus.InProgress, {
        message: "Application status must be in progress to submit",
      }),
  });

export type ApplicationResponseSubmitRequest = z.infer<
  typeof ApplicationResponseSubmitRequestSchema
>;

export const ApplicationResponseSaveRequestSchema =
  ApplicationResponseSchema.pick({
    id: true,
    applicationFormId: true,
    rolesApplied: true,
    sectionResponses: true,
  });

export type ApplicationResponseSaveRequest = z.infer<
  typeof ApplicationResponseSaveRequestSchema
>;
