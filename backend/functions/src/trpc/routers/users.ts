import {
  ApplicantRole,
  FirestoreCollection,
  PermissionRole,
} from "@app-portal/shared/constants";
import type { UserProfileDTO } from "@app-portal/shared/types";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { appCollection } from "../../utils/firestore";
import {
  assertCanReadResponse,
  isReviewCapableUser,
  requireUser,
} from "../access";
import { authedProcedure, router, signedInProcedure } from "../init";
import { loadActiveReviewers } from "./rows/loaders";
import { reviewCapableProcedure } from "./rows/procedures";

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
});
