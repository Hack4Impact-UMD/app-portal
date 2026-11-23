import {
  ApplicationStatus,
  FirestoreCollection,
  QuestionType,
} from "@app-portal/shared/constants";
import type {
  ApplicationFormDTO,
  ApplicationResponseDTO,
  SectionResponse,
} from "@app-portal/shared/types";
import { TRPCError } from "@trpc/server";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { logger } from "firebase-functions";
import { v4 as uuidv4 } from "uuid";
import { z } from "zod";

import { db } from "../../index";
import type { ApplicationForm } from "../../models/appForm";
import type { ApplicationResponse } from "../../models/appResponse";
import { getDocsById } from "../../utils/batch";
import { appCollection } from "../../utils/firestore";
import {
  assertCanReadForm,
  assertCanReadResponse,
  requireUser,
} from "../access";
import { assertCanRespondToForm } from "../guards";
import { authedProcedure } from "../init";
import { loadForm } from "./rows/loaders";
import { reviewCapableProcedure } from "./rows/procedures";

function emptyResponse(userId: string, form: ApplicationForm) {
  const sectionResponses = form.sections.map(
    (section): SectionResponse => ({
      sectionId: section.sectionId,
      sectionName: section.sectionName,
      questions: section.questions.map((question) => ({
        questionId: question.questionId,
        questionType: question.questionType,
        applicationFormId: form.id,
        response:
          question.questionType === QuestionType.MultipleSelect ||
          question.questionType === QuestionType.RoleSelect
            ? []
            : "",
      })),
    }),
  );

  const response: ApplicationResponse = {
    id: uuidv4(),
    userId,
    applicationFormId: form.id,
    sectionResponses,
    status: ApplicationStatus.InProgress,
    dateSubmitted: Timestamp.now(),
    rolesApplied: [],
  };
  return response;
}

export const applicationReadProcedures = {
  mine: authedProcedure.query(
    async ({ ctx }): Promise<ApplicationResponseDTO[]> => {
      return (
        await appCollection(FirestoreCollection.ApplicationResponses)
          .where("userId", "==", ctx.token.uid)
          .get()
      ).docs.map((d) => d.data());
    },
  ),

  mineWithSemester: authedProcedure.query(
    async ({
      ctx,
    }): Promise<
      (ApplicationResponseDTO & { semester: string; active: boolean })[]
    > => {
      const responses = (
        await appCollection(FirestoreCollection.ApplicationResponses)
          .where("userId", "==", ctx.token.uid)
          .get()
      ).docs.map((d) => d.data());

      const forms = await getDocsById(
        appCollection(FirestoreCollection.ApplicationForms),
        responses.map((r) => r.applicationFormId),
      );

      return responses.flatMap((response) => {
        const form = forms.get(response.applicationFormId);
        if (!form) return [];
        return [
          { ...response, semester: form.semester, active: form.isActive },
        ];
      });
    },
  ),

  get: authedProcedure
    .input(z.object({ id: z.string().min(1) }))
    .query(async ({ input, ctx }): Promise<ApplicationResponseDTO | null> => {
      const user = await requireUser(ctx);
      const response = (
        await appCollection(FirestoreCollection.ApplicationResponses)
          .doc(input.id)
          .get()
      ).data();
      if (!response) return null;
      assertCanReadResponse(user, response);
      return response;
    }),

  listForForm: reviewCapableProcedure
    .input(z.object({ formId: z.string().min(1) }))
    .query(async ({ input }): Promise<ApplicationResponseDTO[]> => {
      return (
        await appCollection(FirestoreCollection.ApplicationResponses)
          .where("applicationFormId", "==", input.formId)
          .get()
      ).docs.map((d) => d.data());
    }),

  // A query because the page loads it like one; idempotent after the first call.
  getOrCreate: authedProcedure
    .input(z.object({ formId: z.string().min(1) }))
    .query(
      async ({
        input,
        ctx,
      }): Promise<{
        form: ApplicationFormDTO;
        response: ApplicationResponseDTO;
      }> => {
        const uid = ctx.token.uid;
        const user = await requireUser(ctx);
        const form = await loadForm(input.formId);
        assertCanReadForm(user, form);

        const responses = appCollection(
          FirestoreCollection.ApplicationResponses,
        );
        const existingQuery = responses
          .where("userId", "==", uid)
          .where("applicationFormId", "==", form.id)
          .limit(1);

        const existing = (await existingQuery.get()).docs[0]?.data();
        if (existing) return { form, response: existing };

        await assertCanRespondToForm(uid, user, undefined, form.id);
        if (Timestamp.now().toMillis() >= form.dueDate.toMillis()) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "This application is closed.",
          });
        }

        // Concurrent first visits must not create two responses.
        const response = await db.runTransaction(async (tx) => {
          const raced = (await tx.get(existingQuery)).docs[0]?.data();
          if (raced) return raced;

          const created = emptyResponse(uid, form);
          tx.create(responses.doc(created.id), created);
          tx.update(appCollection(FirestoreCollection.Users).doc(uid), {
            activeApplications: FieldValue.arrayUnion(form.id),
          });
          return created;
        });

        logger.info(`Response ${response.id} for user ${uid}, form ${form.id}`);
        return { form, response };
      },
    ),
};
