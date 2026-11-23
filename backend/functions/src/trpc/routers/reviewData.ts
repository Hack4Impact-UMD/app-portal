import {
  ApplicantRole,
  FirestoreCollection,
} from "@app-portal/shared/constants";
import type { ApplicationReviewData } from "@app-portal/shared/types";
import { ApplicationReviewDataSchema } from "@app-portal/shared/types";
import { TRPCError } from "@trpc/server";
import { v4 as uuidv4 } from "uuid";
import { z } from "zod";

import type { UserProfile } from "../../models/user";
import { appCollection } from "../../utils/firestore";
import { isBoardOrAbove, loadResponse, requireUser } from "../access";
import { router } from "../init";
import { reviewCapableProcedure } from "./rows/procedures";

const collection = () => appCollection(FirestoreCollection.ReviewData);

function assertActive(user: UserProfile) {
  if (user.inactive) {
    throw new TRPCError({ code: "FORBIDDEN", message: "Account is inactive." });
  }
}

export const reviewDataRouter = router({
  get: reviewCapableProcedure
    .input(z.object({ id: z.string().min(1) }))
    .query(async ({ input, ctx }) => {
      const user = await requireUser(ctx);
      const data = (await collection().doc(input.id).get()).data();
      if (!data) throw new TRPCError({ code: "NOT_FOUND" });
      if (!isBoardOrAbove(user) && data.reviewerId !== user.id) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      return data;
    }),

  create: reviewCapableProcedure
    .input(
      z.object({
        applicationResponseId: z.string().min(1),
        forRole: z.enum(ApplicantRole),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      assertActive(ctx.user);
      const response = await loadResponse(input.applicationResponseId);

      const data: ApplicationReviewData = {
        id: uuidv4(),
        applicationFormId: response.applicationFormId,
        applicationResponseId: response.id,
        applicantId: response.userId,
        forRole: input.forRole,
        reviewerId: ctx.user.id,
        applicantScores: {},
        reviewerNotes: {},
        submitted: false,
      };
      await collection().doc(data.id).create(data);
      return data;
    }),

  update: reviewCapableProcedure
    .input(
      z.object({
        id: z.string().min(1),
        patch: ApplicationReviewDataSchema.pick({
          applicantScores: true,
          reviewerNotes: true,
          submitted: true,
        }).partial(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      assertActive(ctx.user);
      const ref = collection().doc(input.id);
      const existing = (await ref.get()).data();
      if (!existing) throw new TRPCError({ code: "NOT_FOUND" });
      if (existing.reviewerId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      await ref.update(input.patch);
    }),
});
