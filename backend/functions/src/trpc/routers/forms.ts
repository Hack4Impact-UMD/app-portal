import { FirestoreCollection } from "@app-portal/shared/constants";
import type { ApplicationFormDTO } from "@app-portal/shared/types";
import { isDecided } from "@app-portal/shared/utils";
import { TRPCError } from "@trpc/server";
import { Timestamp } from "firebase-admin/firestore";
import { z } from "zod";

import { db } from "../../index";
import { appCollection } from "../../utils/firestore";
import {
  assertCanReadForm,
  assertCanReadResponse,
  canReadForm,
  getAssignedResponses,
  requireUser,
} from "../access";
import { authedProcedure, router } from "../init";
import { loadForm } from "./rows/loaders";
import {
  reviewCapableProcedure,
  superReviewerProcedure,
} from "./rows/procedures";

export const formsRouter = router({
  get: authedProcedure
    .input(z.object({ id: z.string().min(1) }))
    .query(async ({ input, ctx }): Promise<ApplicationFormDTO> => {
      const user = await requireUser(ctx);
      const form = await loadForm(input.id);
      assertCanReadForm(user, form);
      return form;
    }),

  getForResponse: authedProcedure
    .input(z.object({ responseId: z.string().min(1) }))
    .query(async ({ input, ctx }): Promise<ApplicationFormDTO> => {
      const user = await requireUser(ctx);
      const response = (
        await appCollection(FirestoreCollection.ApplicationResponses)
          .doc(input.responseId)
          .get()
      ).data();
      if (!response) {
        throw new TRPCError({ code: "NOT_FOUND", message: "No response" });
      }
      const assigned = await getAssignedResponses(ctx.token.sub);
      assertCanReadResponse(user, response, assigned);

      const form = await loadForm(response.applicationFormId);
      assertCanReadForm(user, form);
      return form;
    }),

  list: reviewCapableProcedure.query(
    async (): Promise<ApplicationFormDTO[]> => {
      return (
        await appCollection(FirestoreCollection.ApplicationForms).get()
      ).docs.map((d) => ({ ...d.data(), id: d.id }));
    },
  ),

  // An uninvited private form reads as no active form, as it did under the rules.
  active: authedProcedure.query(
    async ({ ctx }): Promise<ApplicationFormDTO | null> => {
      const user = await requireUser(ctx);
      const forms = (
        await appCollection(FirestoreCollection.ApplicationForms)
          .where("isActive", "==", true)
          .get()
      ).docs.map((d) => d.data());

      return forms.find((f) => canReadForm(user, f)) ?? null;
    },
  ),

  invited: authedProcedure.query(
    async ({ ctx }): Promise<ApplicationFormDTO[]> => {
      return (
        await appCollection(FirestoreCollection.ApplicationForms)
          .where("invitedUsers", "array-contains", ctx.token.uid)
          .get()
      ).docs.map((d) => d.data());
    },
  ),

  setDecisionsReleased: superReviewerProcedure
    .input(z.object({ id: z.string().min(1), released: z.boolean() }))
    .mutation(async ({ input }) => {
      await loadForm(input.id);
      if (input.released) {
        const statuses = await appCollection(
          FirestoreCollection.ApplicationStatus,
        )
          .where("formId", "==", input.id)
          .get();
        if (statuses.docs.some((d) => !isDecided(d.data().status))) {
          throw new TRPCError({
            code: "PRECONDITION_FAILED",
            message:
              "Some applicants have not been decided yet. Can't release decisions.",
          });
        }
      }
      await appCollection(FirestoreCollection.ApplicationForms)
        .doc(input.id)
        .update({ decisionsReleased: input.released });
    }),

  // Only one form may be active at a time.
  setActive: superReviewerProcedure
    .input(z.object({ id: z.string().min(1), active: z.boolean() }))
    .mutation(async ({ input }) => {
      await loadForm(input.id);
      const forms = appCollection(FirestoreCollection.ApplicationForms);
      const batch = db.batch();
      batch.update(forms.doc(input.id), { isActive: input.active });
      if (input.active) {
        const others = await forms.where("isActive", "==", true).get();
        for (const d of others.docs) {
          if (d.id !== input.id) batch.update(d.ref, { isActive: false });
        }
      }
      await batch.commit();
    }),

  setDueDate: superReviewerProcedure
    .input(z.object({ id: z.string().min(1), dueDate: z.date() }))
    .mutation(async ({ input }) => {
      await loadForm(input.id);
      await appCollection(FirestoreCollection.ApplicationForms)
        .doc(input.id)
        .update({ dueDate: Timestamp.fromDate(input.dueDate) });
    }),

  setInvitedUsers: superReviewerProcedure
    .input(
      z.object({
        id: z.string().min(1),
        invitedUsers: z.array(z.string().min(1)),
      }),
    )
    .mutation(async ({ input }) => {
      await loadForm(input.id);
      await appCollection(FirestoreCollection.ApplicationForms)
        .doc(input.id)
        .update({ invitedUsers: input.invitedUsers });
    }),
});
