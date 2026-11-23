import {
  ApplicantRole,
  FirestoreCollection,
  PermissionRole,
} from "@app-portal/shared/constants";
import type { InterviewAssignment } from "@app-portal/shared/types";
import { TRPCError } from "@trpc/server";
import { v4 as uuidv4 } from "uuid";
import { z } from "zod";

import type { UserProfile } from "../../models/user";
import { appCollection } from "../../utils/firestore";
import { isBoardOrAbove, loadResponse, requireUser } from "../access";
import { roleProcedure, router } from "../init";
import { reviewCapableProcedure } from "./rows/procedures";
import type { AnyUserProfile } from "./rows/types";

// The old rules barred super-reviewers from managing interview assignments.
const boardOnlyProcedure = roleProcedure([PermissionRole.Board]);

function assertManagesRole(user: UserProfile, role: ApplicantRole) {
  if (!(user as AnyUserProfile).applicantRoles?.includes(role)) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "You don't manage interviews for this role.",
    });
  }
}

export const interviewAssignmentsRouter = router({
  listForResponse: reviewCapableProcedure
    .input(z.object({ responseId: z.string().min(1) }))
    .query(async ({ input, ctx }) => {
      const user = await requireUser(ctx);
      const assignments = (
        await appCollection(FirestoreCollection.InterviewAssignments)
          .where("applicationResponseId", "==", input.responseId)
          .get()
      ).docs.map((d) => d.data());

      return isBoardOrAbove(user)
        ? assignments
        : assignments.filter((a) => a.interviewerId === user.id);
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
      assertManagesRole(ctx.user, input.forRole);
      const response = await loadResponse(input.applicationResponseId);

      const assignment: InterviewAssignment = {
        id: uuidv4(),
        assignmentType: "interview",
        applicantId: response.userId,
        applicationResponseId: response.id,
        forRole: input.forRole,
        formId: response.applicationFormId,
        interviewerId: input.interviewerId,
      };
      await appCollection(FirestoreCollection.InterviewAssignments)
        .doc(assignment.id)
        .create(assignment);
      return assignment;
    }),

  delete: boardOnlyProcedure
    .input(z.object({ id: z.string().min(1) }))
    .mutation(async ({ input, ctx }) => {
      const ref = appCollection(FirestoreCollection.InterviewAssignments).doc(
        input.id,
      );
      const assignment = (await ref.get()).data();
      if (!assignment) throw new TRPCError({ code: "NOT_FOUND" });
      assertManagesRole(ctx.user, assignment.forRole);
      await ref.delete();
    }),
});
