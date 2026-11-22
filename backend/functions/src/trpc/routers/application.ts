import {
  ApplicationStatus,
  FirestoreCollection,
  ReviewStatus,
  PermissionRole,
} from "@app-portal/shared/constants";
import type {
  ApplicationFormBase,
  InternalApplicationStatus,
  RoleReviewRubric,
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

import { db } from "../../index";
import type { ApplicationResponse } from "../../models/appResponse";
import { appCollection } from "../../utils/firestore";
import { validateResponses } from "../../utils/validateResponses";
import { SubmitValidationError } from "../errors";
import { assertCanRespondToForm } from "../guards";
import { authedProcedure, roleProcedure, router } from "../init";

// gRPC status code Firestore returns when create() hits an existing document.
const ALREADY_EXISTS = 6;

// Form IDs are used verbatim as Firestore document IDs.
const FORM_ID_PATTERN = /^[a-zA-Z0-9][a-zA-Z0-9_-]*$/;

type TimestampLike = { seconds: number; nanoseconds: number };

const FormInputSchema = z.custom<
  ApplicationFormBase & { dueDate: TimestampLike }
>((v) => typeof v === "object" && v !== null);

async function uploadRubrics(
  collection:
    FirestoreCollection.Rubrics | FirestoreCollection.InterviewRubrics,
  rubrics: RoleReviewRubric[],
) {
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

  const rubricsCollection = appCollection(collection);
  const existingRubricsForForm = (
    await rubricsCollection.where("formId", "==", formId).get()
  ).docs;

  await db.runTransaction(async (transaction) => {
    existingRubricsForForm.forEach((existing) =>
      transaction.delete(rubricsCollection.doc(existing.id)),
    );

    rubrics.forEach((rubric) => {
      transaction.set(rubricsCollection.doc(rubric.id), rubric);
    });
  });

  logger.info(`Successfully uploaded ${rubrics.length} rubrics.`);
  return { status: "success" as const, count: rubrics.length };
}

export const applicationRouter = router({
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

      const applicationResponseCollection = appCollection(
        FirestoreCollection.ApplicationResponses,
      );
      const statusCollection = appCollection(
        FirestoreCollection.ApplicationStatus,
      );
      const responseRef = applicationResponseCollection.doc(
        applicationResponse.id,
      );

      // Read-check-write in a transaction so two concurrent submits (or a
      // save racing a submit) can't both pass the in-progress check.
      const newApp = await db.runTransaction(async (tx) => {
        // check that the correct user is updating the application
        const existing = (await tx.get(responseRef)).data();
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
        const form = (
          await tx.get(
            appCollection(FirestoreCollection.ApplicationForms).doc(
              existing.applicationFormId,
            ),
          )
        ).data();
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
        tx.update(responseRef, submitted);

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

          tx.set(statusCollection.doc(status.id), status);
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

      const applicationResponsesCollection = appCollection(
        FirestoreCollection.ApplicationResponses,
      );
      const responseRef = applicationResponsesCollection.doc(newAppResponse.id);

      // Transaction so a save can't flip a response back to in-progress
      // after a concurrent submit has marked it submitted.
      await db.runTransaction(async (tx) => {
        const existingResp = (await tx.get(responseRef)).data();

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

        tx.set(responseRef, newAppResponse);
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

      const formsCollection = appCollection(
        FirestoreCollection.ApplicationForms,
      );

      const existingFormDoc = await formsCollection.doc(formData.id).get();

      if (createOnly && existingFormDoc.exists) {
        logger.warn(`Form ${formData.id} already exists`);
        throw new TRPCError({
          code: "CONFLICT",
          message: "A form with this ID already exists",
        });
      }

      const existingResponses =
        (
          await appCollection(FirestoreCollection.ApplicationResponses)
            .where("applicationFormId", "==", formData.id)
            .get()
        ).docs.length > 0;

      if (existingFormDoc.exists && existingResponses) {
        const existingForm = existingFormDoc.data();
        if (!existingForm) {
          logger.warn(`Existing form ${formData.id} could not be retrieved`);
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Existing form could not be retrieved",
          });
        }

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

      const form = {
        ...formData,
        dueDate: new Timestamp(dueDate.seconds, dueDate.nanoseconds),
      };

      if (createOnly) {
        // create() fails with ALREADY_EXISTS if another request won the race
        // between the check above and this write.
        try {
          await formsCollection.doc(form.id).create(form);
        } catch (error) {
          if ((error as { code?: number }).code === ALREADY_EXISTS) {
            logger.warn(`Form ${form.id} already exists`);
            throw new TRPCError({
              code: "CONFLICT",
              message: "A form with this ID already exists",
            });
          }
          throw error;
        }
      } else {
        await formsCollection.doc(form.id).set(form);
      }
      logger.info(`Created application form with ID: ${form.id}`);

      return { status: "success" as const, formId: form.id };
    }),

  uploadRubrics: roleProcedure([PermissionRole.SuperReviewer])
    .input(z.array(RoleReviewRubricSchema))
    .mutation(({ input }) => uploadRubrics(FirestoreCollection.Rubrics, input)),

  uploadInterviewRubrics: roleProcedure([PermissionRole.SuperReviewer])
    .input(z.array(RoleReviewRubricSchema))
    .mutation(({ input }) =>
      uploadRubrics(FirestoreCollection.InterviewRubrics, input),
    ),
});
