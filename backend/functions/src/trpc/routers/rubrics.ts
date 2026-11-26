import { ApplicantRole } from "@app-portal/shared/constants";
import type { RoleReviewRubric } from "@app-portal/shared/types";
import { validateRubricScoreKeys } from "@app-portal/shared/utils";
import { TRPCError } from "@trpc/server";
import { v4 as uuidv4 } from "uuid";
import { z } from "zod";

import { runTransaction } from "../../services/db";
import { getForm } from "../../services/forms";
import {
  createRubric,
  listRubricsForForm,
  replaceRubricsForForm,
} from "../../services/rubrics";
import { router } from "../init";
import {
  reviewCapableProcedure,
  superReviewerProcedure,
} from "./rows/procedures";

const validRubric = (
  rubrics: RoleReviewRubric[],
  weights: Record<ApplicantRole, Record<string, number>>,
) => {
  const { missingInForm, missingInRubric } = validateRubricScoreKeys(
    rubrics,
    weights,
  );
  return missingInForm.length === 0 && missingInRubric.length === 0;
};

export const rubricsRouter = router({
  list: reviewCapableProcedure
    .input(
      z.object({
        formId: z.string().min(1),
        kind: z.enum(["review", "interview"]),
        role: z.enum(ApplicantRole).optional(),
      }),
    )
    .query(async ({ input: { formId, kind, role } }) => {
      const rubrics = await listRubricsForForm(kind, formId);
      if (!role) return rubrics;
      return rubrics.filter(
        (r) => r.roles.length === 0 || r.roles.includes(role),
      );
    }),
  createForForm: superReviewerProcedure
    .input(
      z.object({
        formId: z.string().min(1),
      }),
    )
    .mutation(async ({ input: { formId } }) => {
      const form = await getForm(formId);
      if (!form) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Destination form not found",
        });
      }

      if (
        (await listRubricsForForm("interview", formId)).length > 0 ||
        (await listRubricsForForm("review", formId)).length > 0
      ) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Destination form already has rubrics",
        });
      }

      const reviewWeights = form.scoreWeights;
      const interviewWeights = form.interviewScoreWeights;

      const roleRubric: (
        _: [string, Record<string, number>],
      ) => RoleReviewRubric = ([role, weights]) => {
        const rubric: RoleReviewRubric = {
          id: uuidv4(),
          formId: formId,
          roles: [role as ApplicantRole],
          rubricQuestions: Object.keys(weights).map((key) => ({
            scoreKey: key,
            prompt: `A default rubric question (key: ${key})`,
            description: `Description for ${key}`,
            maxValue: 4,
            minValue: 1,
          })),
        };

        return rubric;
      };

      const reviewRubrics = Object.entries(reviewWeights)
        .filter(([, w]) => Object.keys(w).length > 0)
        .map(roleRubric);
      const interviewRubrics = Object.entries(interviewWeights)
        .filter(([, w]) => Object.keys(w).length > 0)
        .map(roleRubric);

      await runTransaction(async (tx) => {
        reviewRubrics.forEach((r) => createRubric("review", r, tx));
        interviewRubrics.forEach((r) => createRubric("interview", r, tx));
      });

      return {
        reviewRubrics: reviewRubrics,
        interviewRubrics: interviewRubrics,
      };
    }),
  duplicateFromForm: superReviewerProcedure
    .input(
      z.object({
        sourceFormId: z.string().min(1),
        destFormId: z.string().min(1),
      }),
    )
    .mutation(async ({ input: { sourceFormId, destFormId } }) => {
      const [reviewRubrics, interviewRubrics] = await Promise.all([
        listRubricsForForm("review", sourceFormId),
        listRubricsForForm("interview", sourceFormId),
      ]);
      const form = await getForm(destFormId);

      if (!form) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Destination form not found",
        });
      }

      if (
        (await listRubricsForForm("interview", destFormId)).length > 0 ||
        (await listRubricsForForm("review", destFormId)).length > 0
      ) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Destination form already has rubrics",
        });
      }

      if (
        !validRubric(reviewRubrics, form.scoreWeights) ||
        !validRubric(interviewRubrics, form.interviewScoreWeights)
      ) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Invalid rubric",
        });
      }

      await runTransaction(async (tx) => {
        await replaceRubricsForForm(
          "interview",
          destFormId,
          interviewRubrics.map((r) => ({
            ...r,
            formId: destFormId,
            id: uuidv4(),
          })),
          tx,
        );
        await replaceRubricsForForm(
          "review",
          destFormId,
          reviewRubrics.map((r) => ({
            ...r,
            formId: destFormId,
            id: uuidv4(),
          })),
          tx,
        );
      });
    }),
});
