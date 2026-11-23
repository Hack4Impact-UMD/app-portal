import {
  ApplicantRole,
  ReviewStatus,
  PermissionRole,
} from "@app-portal/shared/constants";
import { DecisionConfirmationSchema } from "@app-portal/shared/types";
import { isDecided } from "@app-portal/shared/utils";
import { TRPCError } from "@trpc/server";
import { logger } from "firebase-functions";
import { z } from "zod";

import {
  getConfirmation,
  responseHasConfirmation,
  setConfirmation,
} from "../../services/decisions";
import { getForm } from "../../services/forms";
import { getResponse } from "../../services/responses";
import {
  denyStatuses,
  getStatus,
  getStatusesByIds,
  getStatusForResponseRole,
  listStatusesForForm,
  updateStatus,
} from "../../services/statuses";
import { orNotFound } from "../errors";
import { authedProcedure, roleProcedure, router } from "../init";
import { boardProcedure, superReviewerProcedure } from "./rows/procedures";

export const statusRouter = router({
  update: superReviewerProcedure
    .input(
      z.object({
        id: z.string().min(1),
        patch: z
          .object({
            status: z.enum(ReviewStatus),
            isQualified: z.boolean(),
          })
          .partial(),
      }),
    )
    .mutation(async ({ input }) => {
      orNotFound(await getStatus(input.id));
      await updateStatus(input.id, input.patch);
    }),

  rejectUndecided: superReviewerProcedure
    .input(z.object({ formId: z.string().min(1) }))
    .mutation(async ({ input }) => {
      const undecided = (await listStatusesForForm(input.formId)).filter(
        (s) => !isDecided(s.status),
      );
      await denyStatuses(undecided.map((s) => s.id));
      return { count: undecided.length };
    }),

  listForForm: boardProcedure
    .input(z.object({ formId: z.string().min(1) }))
    .query(({ input }) => listStatusesForForm(input.formId)),

  getConfirmation: authedProcedure
    .input(z.object({ responseId: z.string().min(1) }))
    .query(
      async ({ input, ctx }) =>
        (await getConfirmation(ctx.token.uid, input.responseId)) ?? null,
    ),

  get: authedProcedure
    .input(z.object({ responseId: z.string(), role: z.enum(ApplicantRole) }))
    .query(async ({ input: { responseId, role }, ctx }) => {
      const responseDoc = await getResponse(responseId);

      if (!responseDoc) {
        logger.warn(`Application response ${responseId} not found`);
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      if (ctx.token.sub !== responseDoc.userId) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      const [data, form] = await Promise.all([
        getStatusForResponseRole(responseId, role),
        getForm(responseDoc.applicationFormId),
      ]);

      if (!data) {
        logger.warn(
          `Application status not found for response ${responseId} and role ${role}`,
        );
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      const released = form?.decisionsReleased;
      if (released === undefined) {
        logger.warn(
          `Application form ${responseDoc.applicationFormId} not found`,
        );
        throw new TRPCError({ code: "NOT_FOUND", message: "Form not found" });
      }

      if (released) {
        return {
          id: data.id,
          status: data.status as ReviewStatus | "decided",
          role: data.role,
          released: true,
        };
      }

      let publicStatus:
        | ReviewStatus.UnderReview
        | ReviewStatus.Interview
        | "decided";
      if (data.status === ReviewStatus.Interview) {
        publicStatus = ReviewStatus.Interview;
      } else if (
        data.status === ReviewStatus.Accepted ||
        data.status === ReviewStatus.Waitlisted ||
        data.status === ReviewStatus.Denied
      ) {
        publicStatus = "decided";
      } else {
        publicStatus = ReviewStatus.UnderReview;
      }

      return {
        id: data.id,
        status: publicStatus as ReviewStatus | "decided",
        role: data.role,
        released: false,
      };
    }),

  confirmDecision: roleProcedure([PermissionRole.Applicant])
    .input(DecisionConfirmationSchema)
    .mutation(async ({ input, ctx }) => {
      const { responseId, userId, internalStatusId } = input;
      const response = await getResponse(input.responseId);

      // Check if user is editing their own decision
      if (userId !== ctx.token.uid || response?.userId !== ctx.token.uid) {
        logger.warn("User is not editing their own decision");
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You cannot edit another person's decision",
        });
      }

      // Use the response's own form, not the client-supplied formId, so a
      // released form can't stand in for this response's unreleased one.
      if (response.applicationFormId !== input.formId) {
        logger.warn(
          `Form ${input.formId} doesn't match response ${responseId}'s form`,
        );
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Form does not match this response.",
        });
      }

      const form = await getForm(response.applicationFormId);
      if (!form?.decisionsReleased) {
        logger.warn("Decisions not yet released");
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Decisions not yet released",
        });
      }

      // Check if confirmation already exists for this responseId
      if (await responseHasConfirmation(responseId)) {
        logger.warn(
          `Confirmation already exists for responseId: ${responseId}`,
        );
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Confirmation already exists for this responseId.",
        });
      }

      // Look up applicant’s internal decision in app-status
      const [statusDoc] = await getStatusesByIds([internalStatusId]);

      if (!statusDoc) {
        logger.warn(
          `No app-status record found for internalStatusId: ${internalStatusId}`,
        );
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "No decision found for this response.",
        });
      }

      if (statusDoc.responseId !== responseId) {
        logger.warn(
          `Status ${internalStatusId} doesn't belong to response ${responseId}`,
        );
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "No decision found for this response.",
        });
      }

      if (statusDoc.status !== ReviewStatus.Accepted) {
        logger.warn(
          `User ${userId} attempted to confirm but was not accepted. Status ID: ${internalStatusId}.`,
        );
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You cannot confirm because you were not accepted.",
        });
      }

      await setConfirmation(input);

      logger.info(`Created confirmation for responseId: ${responseId}`);
      return { message: "Confirmation recorded successfully." };
    }),
});
