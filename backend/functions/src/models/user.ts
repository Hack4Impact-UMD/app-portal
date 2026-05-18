import { Timestamp } from "firebase-admin/firestore";
import { z } from "zod";
import { ApplicantRole, SectionResponseSchema } from "./appResponse";

export enum PermissionRole {
  Applicant = "applicant",
  Reviewer = "reviewer",
  Board = "board",
  SuperReviewer = "super-reviewer",
}

export const UserProfileSchema = z.object({
  id: z.string().nonempty(),
  email: z.email("Must provide a valid email"),
  firstName: z.string().nonempty("First name can't be empty"),
  lastName: z.string().nonempty("Last name can't be empty"),
  role: z.enum(PermissionRole),
  dateCreated: z.custom<Timestamp>((d) => d instanceof Timestamp),
  activeApplications: z.array(z.string()).optional(),
  inactiveApplications: z.array(z.string()).optional(),
  isInternal: z.boolean().optional(),
  inactive: z.boolean().optional(),
});

export const userRegisterFormSchema = UserProfileSchema.pick({
  email: true,
  firstName: true,
  lastName: true,
}).extend({
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number")
    .regex(
      /[^A-Za-z0-9]/,
      "Password must contain at least one special character",
    ),
});

export const updateUserSchema = UserProfileSchema.pick({
  email: true,
  firstName: true,
  lastName: true,
});

export const createInternalApplicantSchema = UserProfileSchema.pick({
  firstName: true,
  lastName: true,
}).extend({
  formId: z.string().nonempty("Form ID can't be empty"),
  rolesApplied: z
    .array(z.enum(ApplicantRole))
    .nonempty("Must select at least one role"),
  sectionResponses: z
    .array(SectionResponseSchema)
    .nonempty("Must provide section responses"),
});

export type UserProfile = z.infer<typeof UserProfileSchema>;
export type UserRegisterForm = z.infer<typeof userRegisterFormSchema>;
export type UpdateUser = z.infer<typeof updateUserSchema>;
export type CreateInternalApplicant = z.infer<
  typeof createInternalApplicantSchema
>;
