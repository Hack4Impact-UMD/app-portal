import { ApplicantRole } from "@app-portal/shared/constants";
import type { AppReviewAssignment } from "@app-portal/shared/types";
import { TRPCError } from "@trpc/server";
import { v4 as uuidv4 } from "uuid";
import { z } from "zod";

import type { ApplicationResponse } from "../../models/appResponse";
import { getResponses, listResponsesForForm } from "../../services/responses";
import {
  createReviewAssignment,
  createReviewAssignments,
  deleteReviewAssignment,
  getReviewAssignment,
  listReviewAssignmentsForForm,
  listReviewAssignmentsForReviewer,
} from "../../services/reviewAssignments";
import {
  hasReviewStarted,
  listReviewDataForForm,
} from "../../services/reviewData";
import { getUsers, listReviewCapableUsers } from "../../services/users";
import { calculateBootcampAssignmentPlan } from "../../utils/autoAssign";
import { canReadAssignedData } from "../access";
import { forbidden, orNotFound } from "../errors";
import { requireUser, router } from "../init";
import { requireResponse } from "../required";
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
          listResponsesForForm(formId),
          listReviewCapableUsers(),
          listReviewAssignmentsForForm(formId),
          listReviewDataForForm(formId),
        ]);

      const usersById = await getUsers(allApplications.map((a) => a.userId));

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
      if (!canReadAssignedData(user, input.reviewerId)) throw forbidden();

      return input.reviewerId
        ? listReviewAssignmentsForReviewer(input.formId, input.reviewerId)
        : (await listReviewAssignmentsForForm(input.formId)).filter(
            (a) => a.assignmentType === "review",
          );
    }),

  create: superReviewerProcedure
    .input(AssignInput)
    .mutation(async ({ input }) => {
      const response = await requireResponse(input.applicationResponseId);
      const assignment = buildAssignment(
        response,
        input.reviewerId,
        input.forRole,
      );
      await createReviewAssignment(assignment);
      return assignment;
    }),

  createMany: superReviewerProcedure
    .input(z.array(AssignInput).max(5000))
    .mutation(async ({ input }) => {
      const responses = await getResponses(
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

      await createReviewAssignments(assignments);
      return { count: assignments.length };
    }),

  delete: superReviewerProcedure
    .input(z.object({ id: z.string().min(1) }))
    .mutation(async ({ input }) => {
      const assignment = orNotFound(await getReviewAssignment(input.id));
      if (await hasReviewStarted(assignment)) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message:
            "The reviewer has already started their review for this assignment. It is not possible to delete it.",
        });
      }
      await deleteReviewAssignment(input.id);
    }),
});
