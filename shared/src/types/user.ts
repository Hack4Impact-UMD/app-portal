import { z } from "zod";

import { ApplicantRole, PermissionRole } from "../constants";
import { SectionResponseSchema } from "./response";

export const UserProfileBaseSchema = z.object({
  id: z.string().nonempty(),
  email: z.email("Must provide a valid email"),
  firstName: z.string().nonempty("First name can't be empty"),
  lastName: z.string().nonempty("Last name can't be empty"),
  inactive: z.boolean().optional(), // true for inactive user. otherwise assumed to be active
});

export const ApplicantUserProfileBaseSchema = UserProfileBaseSchema.extend({
  role: z.literal(PermissionRole.Applicant),
  activeApplications: z.array(z.string()).optional(),
  inactiveApplications: z.array(z.string()).optional(),
  isInternal: z.boolean().optional(),
});

export const ReviewerUserProfileBaseSchema = UserProfileBaseSchema.extend({
  role: z.literal(PermissionRole.Reviewer),
  applicantRolePreferences: z.array(z.enum(ApplicantRole)),
});

export const BoardUserProfileBaseSchema = UserProfileBaseSchema.extend({
  role: z.literal(PermissionRole.Board),
  applicantRoles: z.array(z.enum(ApplicantRole)),
});

export const SuperReviewerUserProfileBaseSchema = UserProfileBaseSchema.extend({
  role: z.literal(PermissionRole.SuperReviewer),
});

export const userRegisterFormSchema = UserProfileBaseSchema.pick({
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

export const updateUserSchema = UserProfileBaseSchema.pick({
  email: true,
  firstName: true,
  lastName: true,
});

export const createInternalApplicantSchema = UserProfileBaseSchema.pick({
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

export type UserProfileBase = z.infer<typeof UserProfileBaseSchema>;
export type ApplicantUserProfileBase = z.infer<
  typeof ApplicantUserProfileBaseSchema
>;
export type ReviewerUserProfileBase = z.infer<
  typeof ReviewerUserProfileBaseSchema
>;
export type BoardUserProfileBase = z.infer<typeof BoardUserProfileBaseSchema>;
export type SuperReviewerUserProfileBase = z.infer<
  typeof SuperReviewerUserProfileBaseSchema
>;
export type UserRegisterForm = z.infer<typeof userRegisterFormSchema>;
export type UpdateUser = z.infer<typeof updateUserSchema>;
export type CreateInternalApplicant = z.infer<
  typeof createInternalApplicantSchema
>;
