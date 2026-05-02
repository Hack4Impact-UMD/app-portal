import { z } from "zod";
import { ApplicantRole } from "./appResponse";
import { Timestamp } from "firebase-admin/firestore";

export const ApplicationQuestion = z.object({
  questionId: z.string().nonempty(),
  questionType: z.string().nonempty(),
  optional: z.boolean(),
  questionText: z.string(),
  secondaryText: z.string().optional(),
  minimumWordCount: z.number().optional(),
  maximumWordCount: z.number().optional(),
});

export const ApplicationSectionSchema = z.object({
  sectionName: z.string(),
  sectionId: z.string(),
  forRoles: z.array(z.enum(ApplicantRole)).optional(),
  questions: z.array(ApplicationQuestion),
});

export const ApplicationFormSchema = z.object({
  id: z.string().nonempty(),
  isActive: z.boolean(),
  dueDate: z.custom<Timestamp>((d) => d instanceof Timestamp),
  semester: z.string(),
  description: z.string(),
  sections: z.array(ApplicationSectionSchema),
  decisionsReleased: z.boolean().default(false),
  disabledRoles: z.array(z.enum(ApplicantRole)).optional(),
});

export type ApplicationSection = z.infer<typeof ApplicationSectionSchema>;
export type ApplicationForm = z.infer<typeof ApplicationFormSchema>;
export type ApplicationQuestion = z.infer<typeof ApplicationQuestion>;
