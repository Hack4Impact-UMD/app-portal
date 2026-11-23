import {
  ApplicantRole,
  FirestoreCollection,
  PermissionRole,
} from "@app-portal/shared/constants";
import type { UserProfileDTO } from "@app-portal/shared/types";
import { TRPCError } from "@trpc/server";
import { FieldValue } from "firebase-admin/firestore";
import { z } from "zod";

import { db } from "../../index";
import { getDocsById } from "../../utils/batch";
import { appCollection } from "../../utils/firestore";
import {
  assertCanReadResponse,
  isReviewCapableUser,
  requireUser,
} from "../access";
import { authedProcedure, router, signedInProcedure } from "../init";
import { loadActiveReviewers } from "./rows/loaders";
import {
  reviewCapableProcedure,
  superReviewerProcedure,
} from "./rows/procedures";
import type { AnyUserProfile } from "./rows/types";

// Reviewers and board members may edit their own roles; super-reviewers may
// edit anyone's.
async function loadEditablePreferences(
  ctx: Parameters<typeof requireUser>[0],
  id: string,
) {
  const me = await requireUser(ctx);
  if (me.role !== PermissionRole.SuperReviewer && me.id !== id) {
    throw new TRPCError({ code: "FORBIDDEN" });
  }

  const ref = appCollection(FirestoreCollection.Users).doc(id);
  const target = (await ref.get()).data();
  if (!target) throw new TRPCError({ code: "NOT_FOUND" });

  if (target.role === PermissionRole.Reviewer) {
    return { ref, field: "applicantRolePreferences" as const };
  }
  if (target.role === PermissionRole.Board) {
    return { ref, field: "applicantRoles" as const };
  }
  throw new TRPCError({
    code: "BAD_REQUEST",
    message: `Role preferences cannot be changed for ${target.role}s.`,
  });
}

export const usersRouter = router({
  // The verify-email page needs the profile before the email is verified.
  me: signedInProcedure.query(async ({ ctx }): Promise<UserProfileDTO> => {
    const user = await ctx.getUser();
    if (!user) throw new TRPCError({ code: "NOT_FOUND" });
    return user as UserProfileDTO;
  }),

  get: authedProcedure
    .input(z.object({ id: z.string().min(1) }))
    .query(async ({ input, ctx }): Promise<UserProfileDTO> => {
      const me = await requireUser(ctx);
      if (input.id !== me.id && !isReviewCapableUser(me)) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      const user = (
        await appCollection(FirestoreCollection.Users).doc(input.id).get()
      ).data();
      if (!user) throw new TRPCError({ code: "NOT_FOUND" });
      return user as UserProfileDTO;
    }),

  getApplicantForResponse: authedProcedure
    .input(z.object({ responseId: z.string().min(1) }))
    .query(async ({ input, ctx }): Promise<UserProfileDTO> => {
      const me = await requireUser(ctx);
      const response = (
        await appCollection(FirestoreCollection.ApplicationResponses)
          .doc(input.responseId)
          .get()
      ).data();
      if (!response) throw new TRPCError({ code: "NOT_FOUND" });
      assertCanReadResponse(me, response);

      const user = (
        await appCollection(FirestoreCollection.Users)
          .doc(response.userId)
          .get()
      ).data();
      if (!user) throw new TRPCError({ code: "NOT_FOUND" });
      return user as UserProfileDTO;
    }),

  list: reviewCapableProcedure.query(async (): Promise<UserProfileDTO[]> => {
    return (await appCollection(FirestoreCollection.Users).get()).docs.map(
      (d) => d.data() as UserProfileDTO,
    );
  }),

  listReviewers: reviewCapableProcedure
    .input(z.object({ role: z.enum(ApplicantRole).optional() }).optional())
    .query(async ({ input }): Promise<UserProfileDTO[]> => {
      const reviewers = await loadActiveReviewers();

      const role = input?.role;
      if (!role) return reviewers as UserProfileDTO[];

      return reviewers.filter(
        (r) =>
          r.role === PermissionRole.SuperReviewer ||
          r.applicantRolePreferences?.includes(role) ||
          r.applicantRoles?.includes(role),
      ) as UserProfileDTO[];
    }),

  setRole: superReviewerProcedure
    .input(
      z.object({
        ids: z.array(z.string().min(1)).min(1).max(500),
        role: z.enum(PermissionRole),
      }),
    )
    .mutation(async ({ input: { ids, role } }) => {
      const collection = appCollection(FirestoreCollection.Users);
      const users = await getDocsById(collection, ids);
      const batch = db.batch();
      for (const user of users.values() as Iterable<AnyUserProfile>) {
        const update: Record<string, unknown> = { role };
        if (
          role === PermissionRole.Reviewer &&
          !user.applicantRolePreferences
        ) {
          update.applicantRolePreferences = Object.values(ApplicantRole);
        }
        if (role === PermissionRole.Board && !user.applicantRoles) {
          update.applicantRoles = [];
        }
        batch.update(collection.doc(user.id), update);
      }
      await batch.commit();
    }),

  setInactive: superReviewerProcedure
    .input(z.object({ id: z.string().min(1), inactive: z.boolean() }))
    .mutation(async ({ input }) => {
      await appCollection(FirestoreCollection.Users)
        .doc(input.id)
        .update({ inactive: input.inactive });
    }),

  delete: superReviewerProcedure
    .input(z.object({ ids: z.array(z.string().min(1)).min(1).max(500) }))
    .mutation(async ({ input }) => {
      const collection = appCollection(FirestoreCollection.Users);
      const batch = db.batch();
      for (const id of input.ids) batch.delete(collection.doc(id));
      await batch.commit();
    }),

  setRolePreferences: authedProcedure
    .input(
      z.object({
        id: z.string().min(1),
        roles: z.array(z.enum(ApplicantRole)),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const { ref, field } = await loadEditablePreferences(ctx, input.id);
      await ref.update({ [field]: input.roles });
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
      const { ref, field } = await loadEditablePreferences(ctx, input.id);
      await ref.update({
        [field]: input.enabled
          ? FieldValue.arrayUnion(input.role)
          : FieldValue.arrayRemove(input.role),
      });
    }),
});
