import { ApplicantRole, PermissionRole } from "@app-portal/shared/constants";
import type { InterviewAssignment } from "@app-portal/shared/types";
import { v4 as uuidv4 } from "uuid";
import { z } from "zod";

import {
  createInterviewAssignment,
  deleteInterviewAssignment,
  getInterviewAssignment,
  listInterviewAssignmentsForResponse,
} from "../../services/interviewAssignments";
import { canReadAssignedData, managesInterviewRole } from "../access";
import { forbidden, orNotFound } from "../errors";
import { requireUser, roleProcedure, router } from "../init";
import { requireResponse } from "../required";
import { reviewCapableProcedure } from "./rows/procedures";

// The old rules barred super-reviewers from managing interview assignments.
const boardOnlyProcedure = roleProcedure([PermissionRole.Board]);

const NOT_MANAGER = "You don't manage interviews for this role.";

export const interviewAssignmentsRouter = router({
  listForResponse: reviewCapableProcedure
    .input(z.object({ responseId: z.string().min(1) }))
    .query(async ({ input, ctx }) => {
      const user = await requireUser(ctx);
      const assignments = await listInterviewAssignmentsForResponse(
        input.responseId,
      );
      return assignments.filter((a) =>
        canReadAssignedData(user, a.interviewerId),
      );
    }),

  create: boardOnlyProcedure
    .input(
      z.object({
        applicationResponseId: z.string().min(1),
        interviewerId: z.string().min(1),
        forRole: z.enum(ApplicantRole),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      if (!managesInterviewRole(ctx.user, input.forRole)) {
        throw forbidden(undefined, NOT_MANAGER);
      }
      const response = await requireResponse(input.applicationResponseId);

      const assignment: InterviewAssignment = {
        id: uuidv4(),
        assignmentType: "interview",
        applicantId: response.userId,
        applicationResponseId: response.id,
        forRole: input.forRole,
        formId: response.applicationFormId,
        interviewerId: input.interviewerId,
      };
      await createInterviewAssignment(assignment);
      return assignment;
    }),

  delete: boardOnlyProcedure
    .input(z.object({ id: z.string().min(1) }))
    .mutation(async ({ input, ctx }) => {
      const assignment = orNotFound(await getInterviewAssignment(input.id));
      if (!managesInterviewRole(ctx.user, assignment.forRole)) {
        throw forbidden(undefined, NOT_MANAGER);
      }
      await deleteInterviewAssignment(input.id);
    }),
});
