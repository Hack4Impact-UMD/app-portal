import {
  ApplicantRole,
  FirestoreCollection,
} from "@app-portal/shared/constants";
import type { AppReviewAssignment } from "@app-portal/shared/types";
import { TRPCError } from "@trpc/server";
import { v4 as uuidv4 } from "uuid";
import { z } from "zod";

import { db } from "../../index";
import type { ApplicationResponse } from "../../models/appResponse";
import { calculateBootcampAssignmentPlan } from "../../utils/autoAssign";
import { getDocsById } from "../../utils/batch";
import { appCollection } from "../../utils/firestore";
import { isBoardOrAbove, loadResponse, requireUser } from "../access";
import { router } from "../init";
import { loadReviewCapableUsers } from "./rows/loaders";
import {
  reviewCapableProcedure,
  superReviewerProcedure,
} from "./rows/procedures";

const AssignInput = z.object({
  applicationResponseId: z.string().min(1),
  reviewerId: z.string().min(1),
  forRole: z.enum(ApplicantRole),
});

function buildAssignment(
  response: ApplicationResponse,
  reviewerId: string,
  forRole: ApplicantRole,
): AppReviewAssignment {
  return {
    id: uuidv4(),
    assignmentType: "review",
    applicantId: response.userId,
    applicationResponseId: response.id,
    forRole,
    formId: response.applicationFormId,
    reviewerId,
  };
}

const BATCH_SIZE = 250;

export const reviewAssignmentsRouter = router({
  autoAssignPlan: superReviewerProcedure
    .input(
      z.object({
        formId: z.string().min(1),
        exemptReviewerIds: z.array(z.string()).default([]),
      }),
    )
    .query(async ({ input: { formId, exemptReviewerIds } }) => {
      const [allApplications, allReviewers, assignments, reviewData] =
        await Promise.all([
          appCollection(FirestoreCollection.ApplicationResponses)
            .where("applicationFormId", "==", formId)
            .get()
            .then((s) => s.docs.map((d) => d.data())),
          loadReviewCapableUsers(),
          appCollection(FirestoreCollection.ReviewAssignments)
            .where("formId", "==", formId)
            .get()
            .then((s) => s.docs.map((d) => d.data())),
          appCollection(FirestoreCollection.ReviewData)
            .where("applicationFormId", "==", formId)
            .get()
            .then((s) => s.docs.map((d) => d.data())),
        ]);

      const usersById = await getDocsById(
        appCollection(FirestoreCollection.Users),
        allApplications.map((a) => a.userId),
      );

      return calculateBootcampAssignmentPlan(
        formId,
        { allApplications, allReviewers, usersById, assignments, reviewData },
        exemptReviewerIds,
      );
    }),

  list: reviewCapableProcedure
    .input(
      z.object({
        formId: z.string().min(1),
        reviewerId: z.string().min(1).optional(),
      }),
    )
    .query(async ({ input, ctx }) => {
      const user = await requireUser(ctx);
      if (!isBoardOrAbove(user) && input.reviewerId !== user.id) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      let query = appCollection(FirestoreCollection.ReviewAssignments)
        .where("formId", "==", input.formId)
        .where("assignmentType", "==", "review");
      if (input.reviewerId) {
        query = query.where("reviewerId", "==", input.reviewerId);
      }
      return (await query.get()).docs.map((d) => d.data());
    }),

  create: superReviewerProcedure
    .input(AssignInput)
    .mutation(async ({ input }) => {
      const response = await loadResponse(input.applicationResponseId);
      const assignment = buildAssignment(
        response,
        input.reviewerId,
        input.forRole,
      );
      await appCollection(FirestoreCollection.ReviewAssignments)
        .doc(assignment.id)
        .create(assignment);
      return assignment;
    }),

  createMany: superReviewerProcedure
    .input(z.array(AssignInput).max(5000))
    .mutation(async ({ input }) => {
      const responses = await getDocsById(
        appCollection(FirestoreCollection.ApplicationResponses),
        input.map((i) => i.applicationResponseId),
      );

      const assignments = input.map((i) => {
        const response = responses.get(i.applicationResponseId);
        if (!response) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: `Response ${i.applicationResponseId} not found`,
          });
        }
        return buildAssignment(response, i.reviewerId, i.forRole);
      });

      const collection = appCollection(FirestoreCollection.ReviewAssignments);
      for (let i = 0; i < assignments.length; i += BATCH_SIZE) {
        const batch = db.batch();
        for (const a of assignments.slice(i, i + BATCH_SIZE)) {
          batch.create(collection.doc(a.id), a);
        }
        await batch.commit();
      }
      return { count: assignments.length };
    }),

  delete: superReviewerProcedure
    .input(z.object({ id: z.string().min(1) }))
    .mutation(async ({ input }) => {
      const ref = appCollection(FirestoreCollection.ReviewAssignments).doc(
        input.id,
      );
      const assignment = (await ref.get()).data();
      if (!assignment) throw new TRPCError({ code: "NOT_FOUND" });

      const started = await appCollection(FirestoreCollection.ReviewData)
        .where("applicantId", "==", assignment.applicantId)
        .where("forRole", "==", assignment.forRole)
        .where("applicationFormId", "==", assignment.formId)
        .where("reviewerId", "==", assignment.reviewerId)
        .limit(1)
        .get();
      if (!started.empty) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message:
            "The reviewer has already started their review for this assignment. It is not possible to delete it.",
        });
      }

      await ref.delete();
    }),
});
