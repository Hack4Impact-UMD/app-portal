import { ApplicantRole, PermissionRole } from "@app-portal/shared/constants";
import type {
  ReviewCapableUserDTO,
  UserProfileDTO,
} from "@app-portal/shared/types";
import { TRPCError } from "@trpc/server";
import { FieldValue } from "firebase-admin/firestore";
import { z } from "zod";

import {
  deleteUsers,
  getUser,
  listReviewCapableUsers,
  listUsers,
  setUsersRole,
  updateUser,
} from "../../services/users";
import { canEditRolePreferences, canReadUser } from "../access";
import { forbidden, orNotFound } from "../errors";
import {
  authedProcedure,
  requireUser,
  router,
  signedInProcedure,
} from "../init";
import { requireReadableResponse } from "../required";
import { reviewingFor } from "./rows/helpers";
import {
  reviewCapableProcedure,
  superReviewerProcedure,
} from "./rows/procedures";

async function rolePreferencesField(
  ctx: Parameters<typeof requireUser>[0],
  id: string,
) {
  const me = await requireUser(ctx);
  if (!canEditRolePreferences(me, id)) throw forbidden();

  const target = orNotFound(await getUser(id));
  if (target.role === PermissionRole.Reviewer) {
    return "applicantRolePreferences" as const;
  }
  if (target.role === PermissionRole.Board) return "applicantRoles" as const;
  throw new TRPCError({
    code: "BAD_REQUEST",
    message: `Role preferences cannot be changed for ${target.role}s.`,
  });
}

export const usersRouter = router({
  // The verify-email page needs the profile before the email is verified.
  me: signedInProcedure.query(
    async ({ ctx }): Promise<UserProfileDTO> => orNotFound(await ctx.getUser()),
  ),

  get: authedProcedure
    .input(z.object({ id: z.string().min(1) }))
    .query(async ({ input, ctx }): Promise<UserProfileDTO> => {
      const me = await requireUser(ctx);
      if (!canReadUser(me, input.id)) throw forbidden();
      return orNotFound(await getUser(input.id));
    }),

  getApplicantForResponse: authedProcedure
    .input(z.object({ responseId: z.string().min(1) }))
    .query(async ({ input, ctx }): Promise<UserProfileDTO> => {
      const me = await requireUser(ctx);
      const response = await requireReadableResponse(me, input.responseId);
      return orNotFound(await getUser(response.userId));
    }),

  list: reviewCapableProcedure.query(
    async (): Promise<UserProfileDTO[]> => listUsers(),
  ),

  listReviewers: reviewCapableProcedure
    .input(z.object({ role: z.enum(ApplicantRole).optional() }).optional())
    .query(async ({ input }): Promise<ReviewCapableUserDTO[]> => {
      const reviewers = await listReviewCapableUsers();

      const role = input?.role;
      if (!role) return reviewers;

      return reviewers.filter((r) => reviewingFor(r).includes(role));
    }),

  setRole: superReviewerProcedure
    .input(
      z.object({
        ids: z.array(z.string().min(1)).min(1).max(500),
        role: z.enum(PermissionRole),
      }),
    )
    .mutation(({ input: { ids, role } }) => setUsersRole(ids, role)),

  setInactive: superReviewerProcedure
    .input(z.object({ id: z.string().min(1), inactive: z.boolean() }))
    .mutation(({ input }) =>
      updateUser(input.id, { inactive: input.inactive }),
    ),

  delete: superReviewerProcedure
    .input(z.object({ ids: z.array(z.string().min(1)).min(1).max(500) }))
    .mutation(({ input }) => deleteUsers(input.ids)),

  setRolePreferences: authedProcedure
    .input(
      z.object({
        id: z.string().min(1),
        roles: z.array(z.enum(ApplicantRole)),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const field = await rolePreferencesField(ctx, input.id);
      await updateUser(input.id, { [field]: input.roles });
    }),

  toggleRolePreference: authedProcedure
    .input(
      z.object({
        id: z.string().min(1),
        role: z.enum(ApplicantRole),
        enabled: z.boolean(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const field = await rolePreferencesField(ctx, input.id);
      await updateUser(input.id, {
        [field]: input.enabled
          ? FieldValue.arrayUnion(input.role)
          : FieldValue.arrayRemove(input.role),
      });
    }),
});
