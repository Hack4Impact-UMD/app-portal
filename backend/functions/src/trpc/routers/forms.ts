import { FirestoreCollection } from "@app-portal/shared/constants";
import type { ApplicationFormDTO } from "@app-portal/shared/types";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { appCollection } from "../../utils/firestore";
import {
  assertCanReadForm,
  assertCanReadResponse,
  canReadForm,
  requireUser,
} from "../access";
import { authedProcedure, router } from "../init";
import { loadForm } from "./rows/loaders";
import { reviewCapableProcedure } from "./rows/procedures";

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
      assertCanReadResponse(user, response);

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
});
