import { PermissionRole } from "@app-portal/shared/constants";
import { UserProfileBaseSchema } from "@app-portal/shared/types";
import { Timestamp } from "firebase-admin/firestore";
import { z } from "zod";

// TODO: backend type does not distinguish between user permission roles
// and it definitely should, but don't want to bundle in current PR
export const UserProfileSchema = UserProfileBaseSchema.extend({
  role: z.enum(PermissionRole),
  dateCreated: z.custom<Timestamp>((d) => d instanceof Timestamp),
  activeApplications: z.array(z.string()).optional(),
  inactiveApplications: z.array(z.string()).optional(),
  isInternal: z.boolean().optional(),
});

export type UserProfile = z.infer<typeof UserProfileSchema>;
