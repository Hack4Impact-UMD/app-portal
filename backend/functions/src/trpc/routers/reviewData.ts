import { ApplicantRole } from "@app-portal/shared/constants";
import type { ApplicationReviewData } from "@app-portal/shared/types";
import { ApplicationReviewDataSchema } from "@app-portal/shared/types";
import { TRPCError } from "@trpc/server";
import { v4 as uuidv4 } from "uuid";
import { z } from "zod";

import type { UserProfile } from "../../models/user";
import {
  createReviewData,
  getReviewData,
  updateReviewData,
} from "../../services/reviewData";
import { canReadAssignedData } from "../access";
import { forbidden, orNotFound } from "../errors";
import { requireUser, router } from "../init";
import { requireResponse } from "../required";
import { reviewCapableProcedure } from "./rows/procedures";

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
      const data = orNotFound(await getReviewData(input.id));
      if (!canReadAssignedData(user, data.reviewerId)) throw forbidden();
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
      const response = await requireResponse(input.applicationResponseId);

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
      await createReviewData(data);
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
      const existing = orNotFound(await getReviewData(input.id));
      if (existing.reviewerId !== ctx.user.id) throw forbidden();
      await updateReviewData(input.id, input.patch);
    }),
});
