import {
  ApplicationStatus,
  QuestionType,
  ReviewStatus,
  PermissionRole,
} from "@app-portal/shared/constants";
import type {
  ApplicationFormBase,
  ApplicationFormDTO,
  ApplicationResponseDTO,
  InternalApplicationStatus,
  RoleReviewRubric,
  SectionResponse,
} from "@app-portal/shared/types";
import {
  ApplicationResponseSaveRequestSchema,
  ApplicationResponseSubmitRequestSchema,
  RoleReviewRubricSchema,
} from "@app-portal/shared/types";
import { TRPCError } from "@trpc/server";
import { Timestamp } from "firebase-admin/firestore";
import { logger } from "firebase-functions";
import { v4 as uuidv4 } from "uuid";
import { z } from "zod";

import type { ApplicationForm } from "../../models/appForm";
import type { ApplicationResponse } from "../../models/appResponse";
import { runTransaction } from "../../services/db";
import { createForm, getForm, getForms, setForm } from "../../services/forms";
import {
  createResponse,
  findUserResponseForForm,
  formHasResponses,
  getResponse,
  listResponsesForForm,
  listResponsesForUser,
  setResponse,
  updateResponse,
} from "../../services/responses";
import type { RubricKind } from "../../services/rubrics";
import { replaceRubricsForForm } from "../../services/rubrics";
import { createStatus } from "../../services/statuses";
import { addActiveApplication } from "../../services/users";
import { validateResponses } from "../../utils/validateResponses";
import { canReadForm } from "../access";
import { forbidden, SubmitValidationError } from "../errors";
import { assertCanRespondToForm } from "../guards";
import { authedProcedure, requireUser, roleProcedure, router } from "../init";
import { ensureCanReadResponse, requireForm } from "../required";
import { reviewCapableProcedure } from "./rows/procedures";

// Form IDs are used verbatim as Firestore document IDs.
const FORM_ID_PATTERN = /^[a-zA-Z0-9][a-zA-Z0-9_-]*$/;

type TimestampLike = { seconds: number; nanoseconds: number };

const FormInputSchema = z.custom<
  ApplicationFormBase & { dueDate: TimestampLike }
>((v) => typeof v === "object" && v !== null);

async function uploadRubrics(kind: RubricKind, rubrics: RoleReviewRubric[]) {
  // Fail fast on duplicate IDs in the payload
  const seen = new Set<string>();
  const formIds = new Set<string>();
  for (const r of rubrics) {
    if (!r?.id) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Each rubric must have a non-empty 'id'.",
      });
    }
    if (seen.has(r.id)) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: `Duplicate rubric id in payload: ${r.id}`,
      });
    }
    seen.add(r.id);
    formIds.add(r.formId);
  }

  if (formIds.size > 1) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `Cannot upload rubrics from multiple forms: ${[...formIds]}`,
    });
  } else if (formIds.size === 0) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "No form IDs specified!",
    });
  }

  const formId = [...formIds][0];

  await replaceRubricsForForm(kind, formId, rubrics);

  logger.info(`Successfully uploaded ${rubrics.length} rubrics.`);
  return { status: "success" as const, count: rubrics.length };
}

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

export const applicationRouter = router({
  mine: authedProcedure.query(
    async ({ ctx }): Promise<ApplicationResponseDTO[]> =>
      listResponsesForUser(ctx.token.uid),
  ),

  mineWithSemester: authedProcedure.query(
    async ({
      ctx,
    }): Promise<
      (ApplicationResponseDTO & { semester: string; active: boolean })[]
    > => {
      const responses = await listResponsesForUser(ctx.token.uid);
      const forms = await getForms(responses.map((r) => r.applicationFormId));

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
      const response = await getResponse(input.id);
      if (!response) return null;
      await ensureCanReadResponse(user, response);
      return response;
    }),

  listForForm: reviewCapableProcedure
    .input(z.object({ formId: z.string().min(1) }))
    // TODO: filter here for only responses the user can read
    .query(
      async ({ input }): Promise<ApplicationResponseDTO[]> =>
        listResponsesForForm(input.formId),
    ),

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
        const form = await requireForm(input.formId);
        if (!canReadForm(user, form)) {
          throw forbidden(`User ${user.id} may not read form ${form.id}`);
        }

        const existing = await findUserResponseForForm(uid, form.id);
        if (existing) return { form, response: existing };

        await assertCanRespondToForm(uid, user, undefined, form.id);
        if (Timestamp.now().toMillis() >= form.dueDate.toMillis()) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "This application is closed.",
          });
        }

        // Concurrent first visits must not create two responses.
        const response = await runTransaction(async (tx) => {
          const raced = await findUserResponseForForm(uid, form.id, tx);
          if (raced) return raced;

          const created = emptyResponse(uid, form);
          createResponse(created, tx);
          addActiveApplication(uid, form.id, tx);
          return created;
        });

        logger.info(`Response ${response.id} for user ${uid}, form ${form.id}`);
        return { form, response };
      },
    ),

  submit: authedProcedure
    .input(ApplicationResponseSubmitRequestSchema)
    .mutation(async ({ input: applicationResponse, ctx }) => {
      await assertCanRespondToForm(
        ctx.token.uid,
        await ctx.getUser(),
        applicationResponse.id,
        applicationResponse.applicationFormId,
      );

      logger.info(`${ctx.token.email} is submitting an application!`);

      // Read-check-write in a transaction so two concurrent submits (or a
      // save racing a submit) can't both pass the in-progress check.
      const newApp = await runTransaction(async (tx) => {
        // check that the correct user is updating the application
        const existing = await getResponse(applicationResponse.id, tx);
        if (!existing) {
          logger.warn(
            `Application response ${applicationResponse.id} not found`,
          );
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Application response not found",
          });
        }

        if (existing.userId !== ctx.token.uid) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "User not authorized to submit this application",
          });
        }

        if (existing.status !== ApplicationStatus.InProgress) {
          logger.warn(`Application response already submitted ${existing.id}`);
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Application already submitted",
          });
        }

        // Check that the response is submitted before the due date specified by the application form
        const form = await getForm(existing.applicationFormId, tx);
        if (!form) {
          logger.warn(
            `Application form ${existing.applicationFormId} not found`,
          );
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Application form not found",
          });
        }

        if (Timestamp.now() > form.dueDate) {
          logger.warn("Submission deadline passed for form:" + form.id);
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Submission deadline has passed",
          });
        }

        const errors = validateResponses(applicationResponse, form);
        if (errors.length !== 0) {
          logger.warn(
            "Validation errors found for response:" + applicationResponse.id,
          );
          logger.warn(errors);
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Application response failed validation",
            cause: new SubmitValidationError(errors),
          });
        }

        // Proceed with updating submission status
        const submitted: ApplicationResponse = {
          id: existing.id,
          userId: existing.userId,
          applicationFormId: existing.applicationFormId,
          rolesApplied: applicationResponse.rolesApplied,
          sectionResponses: applicationResponse.sectionResponses,
          status: ApplicationStatus.Submitted,
          dateSubmitted: Timestamp.now(),
        };
        updateResponse(submitted.id, submitted, tx);

        for (const role of applicationResponse.rolesApplied) {
          logger.info(
            `creating review status object for response ${applicationResponse.id} and role ${role}`,
          );
          const status: InternalApplicationStatus = {
            id: uuidv4(),
            formId: existing.applicationFormId,
            responseId: applicationResponse.id,
            role: role,
            status: ReviewStatus.UnderReview,
            isQualified: false,
          };

          createStatus(status, tx);
        }

        return submitted;
      });

      logger.info("Successfully submitted form!");
      logger.info(newApp);

      return { status: "success" as const, application: newApp };
    }),

  save: authedProcedure
    .input(ApplicationResponseSaveRequestSchema)
    .mutation(async ({ input, ctx }) => {
      const uid = ctx.token.uid;
      await assertCanRespondToForm(
        uid,
        await ctx.getUser(),
        input.id,
        input.applicationFormId,
      );

      logger.info("Received save request for response ID: ", input.id);

      const newAppResponse: ApplicationResponse = {
        id: input.id,
        applicationFormId: input.applicationFormId,
        userId: uid,
        dateSubmitted: Timestamp.now(),
        rolesApplied: input.rolesApplied,
        sectionResponses: input.sectionResponses,
        status: ApplicationStatus.InProgress,
      };

      // Transaction so a save can't flip a response back to in-progress
      // after a concurrent submit has marked it submitted.
      await runTransaction(async (tx) => {
        const existingResp = await getResponse(newAppResponse.id, tx);

        if (!existingResp) {
          logger.warn(
            "Attempt to save a non-existant application: ",
            newAppResponse.id,
          );
          throw new TRPCError({ code: "BAD_REQUEST" });
        }

        if (existingResp.userId !== uid) {
          logger.warn(
            `Unauthorized application save! UID: ${uid} vs existing user id in response ${existingResp.userId}`,
          );
          throw new TRPCError({ code: "FORBIDDEN" });
        }

        if (existingResp.status !== ApplicationStatus.InProgress) {
          logger.warn(
            "Attempt to save a submitted application: ",
            newAppResponse.id,
          );
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Application already submitted",
          });
        }

        setResponse(newAppResponse, tx);
      });
      logger.info(
        `Saved ApplicationResponse with ID: ${newAppResponse.id} for user ${newAppResponse.userId}`,
      );

      return newAppResponse;
    }),

  createForm: roleProcedure([PermissionRole.SuperReviewer])
    .input(
      z.object({
        form: FormInputSchema,
        // This endpoint doubles as the form builder's save, so it upserts by
        // default. Callers creating a brand new form pass createOnly=true to
        // get an atomic "fail if this ID is taken" instead, which avoids the
        // race in checking for a duplicate ID client-side before posting.
        createOnly: z.boolean().default(false),
      }),
    )
    .mutation(async ({ input: { form: formData, createOnly } }) => {
      // The ID becomes a Firestore document ID, so a value containing "/"
      // would be parsed as extra path segments and write the form somewhere
      // else entirely. Only enforced when creating: this endpoint is also the
      // form builder's save, and an existing form whose ID predates this rule
      // must stay editable.
      if (createOnly && !FORM_ID_PATTERN.test(formData.id ?? "")) {
        logger.warn(`Rejected form ID: ${formData.id}`);
        throw new TRPCError({
          code: "BAD_REQUEST",
          message:
            "Form ID must start with a letter or number and contain only letters, numbers, hyphens and underscores",
        });
      }

      const existingForm = await getForm(formData.id);

      if (createOnly && existingForm) {
        logger.warn(`Form ${formData.id} already exists`);
        throw new TRPCError({
          code: "CONFLICT",
          message: "A form with this ID already exists",
        });
      }

      if (existingForm && (await formHasResponses(formData.id))) {
        const existingSectionIds = existingForm.sections.map(
          (s) => s.sectionId,
        );
        const newSectionIds = formData.sections.map((s) => s.sectionId);

        if (
          JSON.stringify(existingSectionIds) !== JSON.stringify(newSectionIds)
        ) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message:
              "New form has different section IDs or section order from existing form.",
          });
        }

        for (let i = 0; i < existingForm.sections.length; i++) {
          const existingQuestionIds = existingForm.sections[i].questions.map(
            (q) => q.questionId,
          );
          const newQuestionIds = formData.sections[i].questions.map(
            (q) => q.questionId,
          );
          if (
            JSON.stringify(existingQuestionIds) !==
            JSON.stringify(newQuestionIds)
          ) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: `New form has different question IDs or question order in section ${existingForm.sections[i].sectionId}.`,
            });
          }
        }
      }

      const dueDate = formData.dueDate;
      if (!dueDate || typeof dueDate !== "object") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Invalid dueDate format",
        });
      }
      if (
        typeof dueDate.seconds !== "number" ||
        typeof dueDate.nanoseconds !== "number"
      ) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Invalid dueDate timestamp format",
        });
      }

      const form: ApplicationForm = {
        ...formData,
        dueDate: new Timestamp(dueDate.seconds, dueDate.nanoseconds),
      };

      if (createOnly) {
        // Another request may have won the race since the check above.
        if (!(await createForm(form))) {
          logger.warn(`Form ${form.id} already exists`);
          throw new TRPCError({
            code: "CONFLICT",
            message: "A form with this ID already exists",
          });
        }
      } else {
        await setForm(form);
      }
      logger.info(`Created application form with ID: ${form.id}`);

      return { status: "success" as const, formId: form.id };
    }),

  uploadRubrics: roleProcedure([PermissionRole.SuperReviewer])
    .input(z.array(RoleReviewRubricSchema))
    .mutation(({ input }) => uploadRubrics("review", input)),

  uploadInterviewRubrics: roleProcedure([PermissionRole.SuperReviewer])
    .input(z.array(RoleReviewRubricSchema))
    .mutation(({ input }) => uploadRubrics("interview", input)),
});
