import type { ApplicationFormDTO } from "@app-portal/shared/types";
import { isDecided } from "@app-portal/shared/utils";
import { TRPCError } from "@trpc/server";
import { Timestamp } from "firebase-admin/firestore";
import { z } from "zod";

import {
  listActiveForms,
  listForms,
  listFormsInvitingUser,
  setActiveForm,
  updateForm,
} from "../../services/forms";
import { listStatusesForForm } from "../../services/statuses";
import { canReadForm } from "../access";
import { forbidden } from "../errors";
import { authedProcedure, requireUser, router } from "../init";
import { requireForm, requireReadableResponse } from "../required";
import {
  reviewCapableProcedure,
  superReviewerProcedure,
} from "./rows/procedures";

export const formsRouter = router({
  get: authedProcedure
    .input(z.object({ id: z.string().min(1) }))
    .query(async ({ input, ctx }): Promise<ApplicationFormDTO> => {
      const user = await requireUser(ctx);
      const form = await requireForm(input.id);
      if (!canReadForm(user, form)) {
        throw forbidden(`User ${user.id} may not read form ${form.id}`);
      }
      return form;
    }),

  getForResponse: authedProcedure
    .input(z.object({ responseId: z.string().min(1) }))
    .query(async ({ input, ctx }): Promise<ApplicationFormDTO> => {
      const user = await requireUser(ctx);
      const response = await requireReadableResponse(user, input.responseId);

      const form = await requireForm(response.applicationFormId);
      if (!canReadForm(user, form)) {
        throw forbidden(`User ${user.id} may not read form ${form.id}`);
      }
      return form;
    }),

  list: reviewCapableProcedure.query(
    async (): Promise<ApplicationFormDTO[]> => listForms(),
  ),

  // An uninvited private form reads as no active form, as it did under the rules.
  active: authedProcedure.query(
    async ({ ctx }): Promise<ApplicationFormDTO | null> => {
      const user = await requireUser(ctx);
      const forms = await listActiveForms();
      return forms.find((f) => canReadForm(user, f)) ?? null;
    },
  ),

  invited: authedProcedure.query(
    async ({ ctx }): Promise<ApplicationFormDTO[]> =>
      listFormsInvitingUser(ctx.token.uid),
  ),

  setDecisionsReleased: superReviewerProcedure
    .input(z.object({ id: z.string().min(1), released: z.boolean() }))
    .mutation(async ({ input }) => {
      await requireForm(input.id);
      if (input.released) {
        const statuses = await listStatusesForForm(input.id);
        if (statuses.some((s) => !isDecided(s.status))) {
          throw new TRPCError({
            code: "PRECONDITION_FAILED",
            message:
              "Some applicants have not been decided yet. Can't release decisions.",
          });
        }
      }
      await updateForm(input.id, { decisionsReleased: input.released });
    }),

  setActive: superReviewerProcedure
    .input(z.object({ id: z.string().min(1), active: z.boolean() }))
    .mutation(async ({ input }) => {
      await requireForm(input.id);
      await setActiveForm(input.id, input.active);
    }),

  setDueDate: superReviewerProcedure
    .input(z.object({ id: z.string().min(1), dueDate: z.date() }))
    .mutation(async ({ input }) => {
      await requireForm(input.id);
      await updateForm(input.id, {
        dueDate: Timestamp.fromDate(input.dueDate),
      });
    }),

  setInvitedUsers: superReviewerProcedure
    .input(
      z.object({
        id: z.string().min(1),
        invitedUsers: z.array(z.string().min(1)),
      }),
    )
    .mutation(async ({ input }) => {
      await requireForm(input.id);
      await updateForm(input.id, { invitedUsers: input.invitedUsers });
    }),
});
