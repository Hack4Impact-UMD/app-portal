import {
  ApplicantRole,
  FirestoreCollection,
  ReviewStatus,
  PermissionRole,
} from "@app-portal/shared/constants";
import { DecisionConfirmationSchema } from "@app-portal/shared/types";
import { TRPCError } from "@trpc/server";
import { logger } from "firebase-functions";
import { z } from "zod";

import { appCollection } from "../../utils/firestore";
import { authedProcedure, roleProcedure, router } from "../init";

export const statusRouter = router({
  get: authedProcedure
    .input(z.object({ responseId: z.string(), role: z.enum(ApplicantRole) }))
    .query(async ({ input: { responseId, role }, ctx }) => {
      const responseDoc = (
        await appCollection(FirestoreCollection.ApplicationResponses)
          .doc(responseId)
          .get()
      ).data();

      if (!responseDoc) {
        logger.warn(`Application response ${responseId} not found`);
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      if (ctx.token.sub !== responseDoc.userId) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      const [status, form] = await Promise.all([
        appCollection(FirestoreCollection.ApplicationStatus)
          .where("role", "==", role)
          .where("responseId", "==", responseId)
          .get(),
        appCollection(FirestoreCollection.ApplicationForms)
          .doc(responseDoc.applicationFormId)
          .get(),
      ]);

      const data = status.docs[0]?.data();
      if (!data) {
        logger.warn(
          `Application status not found for response ${responseId} and role ${role}`,
        );
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      const released = form.data()?.decisionsReleased;
      if (released === undefined) {
        logger.warn(
          `Application form ${responseDoc.applicationFormId} not found`,
        );
        throw new TRPCError({ code: "NOT_FOUND", message: "Form not found" });
      }

      if (released) {
        return {
          id: status.docs[0].id,
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
        id: status.docs[0].id,
        status: publicStatus as ReviewStatus | "decided",
        role: data.role,
        released: false,
      };
    }),

  confirmDecision: roleProcedure([PermissionRole.Applicant])
    .input(DecisionConfirmationSchema)
    .mutation(async ({ input, ctx }) => {
      const decisionStatusCollection = appCollection(
        FirestoreCollection.DecisionStatus,
      );
      const { responseId, userId, internalStatusId } = input;

      // Check if user is editing their own decision
      if (userId !== ctx.token.uid) {
        logger.warn("User is not editing their own decision");
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You cannot edit another person's decision",
        });
      }

      // Check if confirmation already exists for this responseId
      const existingConfirmation = await decisionStatusCollection
        .where("responseId", "==", responseId)
        .get();
      if (!existingConfirmation.empty) {
        logger.warn(
          `Confirmation already exists for responseId: ${responseId}`,
        );
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Confirmation already exists for this responseId.",
        });
      }

      // Look up applicant’s internal decision in app-status
      const statusDocs = await appCollection(
        FirestoreCollection.ApplicationStatus,
      )
        .where("id", "==", internalStatusId)
        .get();

      if (statusDocs.empty) {
        logger.warn(
          `No app-status record found for internalStatusId: ${internalStatusId}`,
        );
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "No decision found for this response.",
        });
      }

      if (statusDocs.docs[0].data().status !== ReviewStatus.Accepted) {
        logger.warn(
          `User ${userId} attempted to confirm but was not accepted. Status ID: ${internalStatusId}.`,
        );
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You cannot confirm because you were not accepted.",
        });
      }

      await decisionStatusCollection.doc(`${responseId}_${userId}`).set(input);

      logger.info(`Created confirmation for responseId: ${responseId}`);
      return { message: "Confirmation recorded successfully." };
    }),
});
