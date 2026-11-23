import { ApplicantRole } from "@app-portal/shared/constants";
import type { ApplicationInterviewData } from "@app-portal/shared/types";
import { ApplicationInterviewDataSchema } from "@app-portal/shared/types";
import { TRPCError } from "@trpc/server";
import { v4 as uuidv4 } from "uuid";
import { z } from "zod";

import type { UserProfile } from "../../models/user";
import {
  createInterviewData,
  getInterviewData,
  updateInterviewData,
} from "../../services/interviewData";
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

export const interviewDataRouter = router({
  get: reviewCapableProcedure
    .input(z.object({ id: z.string().min(1) }))
    .query(async ({ input, ctx }) => {
      const user = await requireUser(ctx);
      const data = orNotFound(await getInterviewData(input.id));
      if (!canReadAssignedData(user, data.interviewerId)) throw forbidden();
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

      const data: ApplicationInterviewData = {
        id: uuidv4(),
        applicationFormId: response.applicationFormId,
        applicationResponseId: response.id,
        applicantId: response.userId,
        forRole: input.forRole,
        interviewerId: ctx.user.id,
        interviewScores: {},
        interviewerNotes: {},
        submitted: false,
      };
      await createInterviewData(data);
      return data;
    }),

  update: reviewCapableProcedure
    .input(
      z.object({
        id: z.string().min(1),
        patch: ApplicationInterviewDataSchema.pick({
          interviewScores: true,
          interviewerNotes: true,
          submitted: true,
        }).partial(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      assertActive(ctx.user);
      const existing = orNotFound(await getInterviewData(input.id));
      if (existing.interviewerId !== ctx.user.id) throw forbidden();
      await updateInterviewData(input.id, input.patch);
    }),
});
