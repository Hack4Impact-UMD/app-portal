import { ApplicationStatus, QuestionType } from "@app-portal/shared/constants";
import type { Request, Response } from "express";
import { Router } from "express";
import { db } from "../index";
import { validateSchema } from "../middleware/validation";
import type {
  ApplicationResponse,
  ApplicationResponseSaveRequest,
  ApplicationResponseSubmitRequest,
} from "../models/appResponse";
import {
  ApplicationResponseSaveRequestSchema,
  ApplicationResponseSubmitRequestSchema,
} from "../models/appResponse";
import type { CollectionReference } from "firebase-admin/firestore";
import { Timestamp } from "firebase-admin/firestore";
import { logger } from "firebase-functions";
import { hasRoles, isAuthenticated } from "../middleware/authentication";
import type { ApplicationForm } from "../models/appForm";
import type { InternalApplicationStatus } from "../models/appStatus";
import { ReviewStatus } from "../models/appStatus";
import { v4 as uuidv4 } from "uuid";
import { z } from "zod";
import { PermissionRole } from "../models/user";
import type {
  QuestionResponse,
  RoleReviewRubric,
} from "@app-portal/shared/types";
import { RoleReviewRubricSchema } from "@app-portal/shared/types";
// import * as admin from "firebase-admin"

const router = Router();

const APPLICATION_RESPONSE_COLLECTION = "application-responses";
const APPLICATION_FORMS_COLLECTION = "application-forms";
const APPLICATION_STATUS_COLLECTION = "app-status";
const RUBRICS_COLLECTION = "rubrics";
const INTERVIEW_RUBRICS_COLLECTION = "interview-rubrics";

interface QuestionMetadata {
  optional: boolean;
  minimumWordCount?: number;
  maximumWordCount?: number;
}

type ValidationError = {
  sectionId: string;
  questionId: string;
  message: string;
};

function validateResponses(
  applicationResponse: ApplicationResponseSubmitRequest,
  applicationForm: ApplicationForm,
): ValidationError[] {
  const errors: ValidationError[] = [];

  // fill formQuestions map
  const formQuestions = new Map<string, QuestionMetadata>(
    applicationForm.sections.flatMap((section) =>
      section.questions.map((q) => {
        const metadata: QuestionMetadata = {
          optional: q.optional,
        };

        if (
          q.questionType === QuestionType.ShortAnswer ||
          q.questionType === QuestionType.LongAnswer
        ) {
          metadata.minimumWordCount = q.minimumWordCount;
          metadata.maximumWordCount = q.maximumWordCount;
        }

        return [q.questionId, metadata];
      }),
    ),
  );

  const findRoleSelect = () => {
    let roleSelectQuestion: QuestionResponse | undefined;
    let sectionId: string | undefined;
    for (const section of applicationResponse.sectionResponses) {
      roleSelectQuestion = section.questions.find(
        (q) => q.questionType === QuestionType.RoleSelect,
      );
      sectionId = section.sectionId;
      if (roleSelectQuestion) break;
    }

    return { roleSelectQuestion, sectionId };
  };

  if (applicationResponse.rolesApplied.length === 0) {
    const { roleSelectQuestion, sectionId } = findRoleSelect();
    return [
      {
        questionId: roleSelectQuestion!.questionId,
        sectionId: sectionId!,
        message: "You must apply for at least one role",
      },
    ];
  }

  if (applicationForm.disabledRoles !== undefined) {
    const disabledRoles = applicationForm.disabledRoles;
    const appliedDisabled = applicationResponse.rolesApplied.some((r) =>
      disabledRoles.includes(r),
    );
    const { roleSelectQuestion, sectionId } = findRoleSelect();

    if (appliedDisabled) {
      return [
        {
          questionId: roleSelectQuestion!.questionId,
          sectionId: sectionId!,
          message: "You cannot apply for disabled roles",
        },
      ];
    }
  }

  // validate each response
  for (const section of applicationResponse.sectionResponses) {
    const formSection = applicationForm.sections.find(
      (s) => s.sectionId === section.sectionId,
    );
    if (!formSection) {
      throw new Error("Invalid form section: " + section.sectionId);
    }

    if (formSection.forRoles) {
      if (
        formSection.forRoles.filter((role) =>
          applicationResponse.rolesApplied.includes(role),
        ).length === 0
      ) {
        continue;
      }
    }

    for (const question of section.questions) {
      const metaData = formQuestions.get(question.questionId);
      if (!metaData) {
        logger.error(`Question ${question.questionId} has no metadata`);
        continue;
      }

      if (metaData?.optional) continue; // no need for validation

      if (metaData?.optional === false && question.response.length === 0) {
        errors.push({
          sectionId: section.sectionId,
          questionId: question.questionId,
          message: "This question is required",
        });
      }

      const responseText = question.response.toString().trim();
      const wordCount =
        responseText === "" ? 0 : responseText.split(/\s+/).length;
      const min = metaData?.minimumWordCount ?? 0;
      const max = metaData?.maximumWordCount ?? Infinity;

      if (wordCount < min || wordCount > max) {
        const diff = wordCount < min ? min - wordCount : wordCount - max;
        const wordLabel = diff === 1 ? "word" : "words";
        const message =
          wordCount < min
            ? `This response is too short. You are ${diff} ${wordLabel} below the minimum word count.`
            : `This response is too long. You are ${diff} ${wordLabel} above the maximum word count.`;

        errors.push({
          sectionId: section.sectionId,
          questionId: question.questionId,
          message,
        });
      }
    }
  }

  return errors;
}

router.post(
  "/submit",
  [
    isAuthenticated,
    hasRoles([PermissionRole.Applicant]),
    validateSchema(ApplicationResponseSubmitRequestSchema),
  ],
  async (req: Request, res: Response) => {
    try {
      const applicationResponse = req.body as ApplicationResponseSubmitRequest;

      logger.info(`${req.token?.email} is submitting an application!`);

      // initialize connections to collections
      const applicationResponseCollection = db.collection(
        APPLICATION_RESPONSE_COLLECTION,
      ) as CollectionReference<ApplicationResponse>;
      const applicationFormCollection = db.collection(
        APPLICATION_FORMS_COLLECTION,
      ) as CollectionReference<ApplicationForm>;
      const statusCollection = db.collection(
        APPLICATION_STATUS_COLLECTION,
      ) as CollectionReference<InternalApplicationStatus>;

      // check that the correct user is updating the application
      const applicationDoc = await applicationResponseCollection
        .doc(applicationResponse.id)
        .get();
      const formattedApplicationDoc =
        applicationDoc.data() as ApplicationResponse;
      if (formattedApplicationDoc.userId !== req.token?.uid) {
        return res
          .status(403)
          .send("User not authorized to submit this application");
      }

      // Check that the response is submitted before the due date specified by the application form
      const applicationFormDoc = await applicationFormCollection
        .doc(formattedApplicationDoc.applicationFormId)
        .get();
      const applicationFormDocData = applicationFormDoc.data();

      const currentTime = Timestamp.now();
      const dueDate = applicationFormDocData!.dueDate;
      if (currentTime > dueDate) {
        logger.warn(
          "Submission deadline passed for form:" + applicationFormDocData?.id,
        );
        return res.status(400).send("Submission deadline has passed");
      }

      try {
        const errors = validateResponses(
          applicationResponse,
          applicationFormDocData!,
        );

        if (errors.length !== 0) {
          logger.warn(
            "Validation errors found for response:" + applicationResponse.id,
          );
          logger.warn(errors);
          return res.status(400).json({
            status: "error",
            validationErrors: errors,
          });
        }
      } catch (err) {
        logger.error("Validation error: ");
        logger.error(err);
        return res.status(500).send();
      }

      // Proceed with updating submission status
      const newApp: ApplicationResponse = {
        id: formattedApplicationDoc.id,
        userId: formattedApplicationDoc.userId,
        applicationFormId: formattedApplicationDoc.applicationFormId,
        rolesApplied: applicationResponse.rolesApplied,
        sectionResponses: applicationResponse.sectionResponses,
        status: ApplicationStatus.Submitted,
        dateSubmitted: Timestamp.now(),
      };
      await applicationResponseCollection
        .doc(applicationResponse.id)
        .update(newApp);

      for (const role of applicationResponse.rolesApplied) {
        logger.info(
          `creating review status object for response ${applicationResponse.id} and role ${role}`,
        );
        const id = uuidv4();

        const status: InternalApplicationStatus = {
          id: id,
          formId: applicationResponse.applicationFormId,
          responseId: applicationResponse.id,
          role: role,
          status: ReviewStatus.UnderReview,
          isQualified: false,
        };

        await statusCollection.doc(status.id).set(status);
      }

      logger.info("Successfully submitted form!");
      logger.info(newApp);

      return res.status(200).json({
        status: "success",
        application: newApp,
      });
    } catch (error) {
      logger.error("Error submitting application:", error);
      return res.status(500).send("Internal server error.");
    }
  },
);

router.put(
  "/save/:respId",
  [
    isAuthenticated,
    hasRoles([PermissionRole.Applicant]),
    validateSchema(ApplicationResponseSaveRequestSchema),
  ],
  async (req: Request, res: Response) => {
    const input = req.body as ApplicationResponseSaveRequest;
    const respId = req.params.respId;
    logger.info("Received save request for response ID: ", respId);

    try {
      const newAppResponse: ApplicationResponse = {
        id: input.id,
        applicationFormId: input.applicationFormId,
        userId: req.token!.uid,
        dateSubmitted: Timestamp.now(),
        rolesApplied: input.rolesApplied,
        sectionResponses: input.sectionResponses,
        status: ApplicationStatus.InProgress,
      };

      if (respId !== newAppResponse.id) {
        logger.error("Application save: Response ID mismatch");
        res.status(400).send();
        return;
      }

      const appCollection = db.collection(
        APPLICATION_RESPONSE_COLLECTION,
      ) as CollectionReference<ApplicationResponse>;

      const existingResp = (
        await appCollection.doc(newAppResponse.id).get()
      ).data();

      if (!existingResp) {
        logger.warn(
          "Attempt to save a non-existant application: ",
          newAppResponse.id,
        );
        res.status(400).send();
        return;
      }

      if (existingResp.userId !== req.token!.uid) {
        logger.warn(
          `Unauthorized application save! UID: ${req.token!.uid} vs existing user id in response ${existingResp.userId}`,
        );
        logger.warn(`response id: ${respId}`);
        res.status(403).send();
        return;
      }

      await appCollection.doc(existingResp.id).set(newAppResponse);
      logger.info(
        `Saved ApplicationResponse with ID: ${newAppResponse.id} for user ${newAppResponse.userId}`,
      );

      res.status(201).send(newAppResponse);
    } catch (error) {
      logger.error("Failed to create application response:", error);
      res
        .status(400)
        .send(error instanceof Error ? error.message : "Unknown error");
    }
  },
);

// todo: this should be updated to test newer ApplicationForm fields
router.post(
  "/forms",
  [isAuthenticated, hasRoles([PermissionRole.SuperReviewer])],
  async (req: Request, res: Response) => {
    try {
      const formData = req.body as ApplicationForm;
      const formsCollection = db.collection(
        APPLICATION_FORMS_COLLECTION,
      ) as CollectionReference<ApplicationForm>;
      const responsesCollection = db.collection(
        APPLICATION_RESPONSE_COLLECTION,
      ) as CollectionReference<ApplicationResponse>;

      const existingFormDoc = await formsCollection.doc(formData.id).get();
      const existingResponses =
        (
          await responsesCollection
            .where("applicationFormId", "==", formData.id)
            .get()
        ).docs.length > 0;

      if (existingFormDoc.exists && existingResponses) {
        const existingForm = existingFormDoc.data() as ApplicationForm;
        const existingSectionIds = existingForm.sections.map(
          (s) => s.sectionId,
        );
        const newSectionIds = formData.sections.map((s) => s.sectionId);

        if (
          JSON.stringify(existingSectionIds) !== JSON.stringify(newSectionIds)
        ) {
          return res
            .status(400)
            .send(
              "New form has different section IDs or section order from existing form.",
            );
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
            return res
              .status(400)
              .send(
                `New form has different question IDs or question order in section ${existingForm.sections[i].sectionId}.`,
              );
          }
        }
      }

      if (!formData.dueDate || typeof formData.dueDate !== "object") {
        return res.status(400).send("Invalid dueDate format");
      }

      const dueDate = formData.dueDate as {
        seconds: number;
        nanoseconds: number;
      };
      if (
        typeof dueDate.seconds !== "number" ||
        typeof dueDate.nanoseconds !== "number"
      ) {
        return res.status(400).send("Invalid dueDate timestamp format");
      }

      const form = {
        ...formData,
        dueDate: new Timestamp(dueDate.seconds, dueDate.nanoseconds),
      };

      await formsCollection.doc(form.id).set(form);
      logger.info(`Created application form with ID: ${form.id}`);

      return res.status(201).json({ status: "success", formId: form.id });
    } catch (error) {
      logger.error("Failed to create application form:", error);
      return res.status(500).send("Failed to create application form");
    }
  },
);

router.post(
  "/rubrics",
  [
    isAuthenticated,
    hasRoles([PermissionRole.SuperReviewer]),
    validateSchema(z.array(RoleReviewRubricSchema)),
  ],
  async (req: Request, res: Response) => {
    try {
      const rubrics = req.body as RoleReviewRubric[];
      if (!Array.isArray(rubrics)) {
        return res
          .status(400)
          .send("Request body must be an array of rubrics.");
      }

      // Fail fast on duplicate IDs in the payload
      const seen = new Set<string>();
      const formIds = new Set<string>();
      for (const r of rubrics) {
        if (!r?.id) {
          return res
            .status(400)
            .send("Each rubric must have a non-empty 'id'.");
        }
        if (seen.has(r.id)) {
          return res
            .status(400)
            .send(`Duplicate rubric id in payload: ${r.id}`);
        }
        seen.add(r.id);
        formIds.add(r.formId);
      }

      if (formIds.size > 1) {
        return res
          .status(400)
          .send(`Cannot upload rubrics from multiple forms: ${[...formIds]}`);
      } else if (formIds.size === 0) {
        return res.status(400).send("No form IDs specified!");
      }

      const formId = [...formIds][0];

      const rubricsCollection = db.collection(
        RUBRICS_COLLECTION,
      ) as CollectionReference<RoleReviewRubric>;
      const existingRubricsForForm = (
        await db
          .collection(RUBRICS_COLLECTION)
          .where("formId", "==", formId)
          .get()
      ).docs;

      await db.runTransaction(async (transaction) => {
        existingRubricsForForm.forEach((existing) =>
          transaction.delete(rubricsCollection.doc(existing.id)),
        );

        rubrics.forEach((rubric) => {
          const docRef = rubricsCollection.doc(rubric.id);
          transaction.set(docRef, rubric);
        });
      });

      logger.info(`Successfully uploaded ${rubrics.length} rubrics.`);
      return res.status(201).json({ status: "success", count: rubrics.length });
    } catch (error) {
      logger.error("Failed to upload rubrics:", error);
      return res.status(500).send("Failed to upload rubrics");
    }
  },
);

router.post(
  "/interview-rubrics",
  [
    isAuthenticated,
    hasRoles([PermissionRole.SuperReviewer]),
    validateSchema(z.array(RoleReviewRubricSchema)),
  ],
  async (req: Request, res: Response) => {
    try {
      const rubrics = req.body as RoleReviewRubric[];
      if (!Array.isArray(rubrics)) {
        return res
          .status(400)
          .send("Request body must be an array of rubrics.");
      }

      // Fail fast on duplicate IDs in the payload
      const seen = new Set<string>();
      const formIds = new Set<string>();
      for (const r of rubrics) {
        if (!r?.id) {
          return res
            .status(400)
            .send("Each rubric must have a non-empty 'id'.");
        }
        if (seen.has(r.id)) {
          return res
            .status(400)
            .send(`Duplicate rubric id in payload: ${r.id}`);
        }
        seen.add(r.id);
        formIds.add(r.formId);
      }

      if (formIds.size > 1) {
        return res
          .status(400)
          .send(`Cannot upload rubrics from multiple forms: ${[...formIds]}`);
      } else if (formIds.size === 0) {
        return res.status(400).send("No form IDs specified!");
      }

      const formId = [...formIds][0];

      const rubricsCollection = db.collection(
        INTERVIEW_RUBRICS_COLLECTION,
      ) as CollectionReference<RoleReviewRubric>;
      const existingRubricsForForm = (
        await db
          .collection(INTERVIEW_RUBRICS_COLLECTION)
          .where("formId", "==", formId)
          .get()
      ).docs;

      await db.runTransaction(async (transaction) => {
        existingRubricsForForm.forEach((existing) =>
          transaction.delete(rubricsCollection.doc(existing.id)),
        );

        rubrics.forEach((rubric) => {
          const docRef = rubricsCollection.doc(rubric.id);
          transaction.set(docRef, rubric);
        });
      });

      logger.info(`Successfully uploaded ${rubrics.length} rubrics.`);
      return res.status(201).json({ status: "success", count: rubrics.length });
    } catch (error) {
      logger.error("Failed to upload rubrics:", error);
      return res.status(500).send("Failed to upload rubrics");
    }
  },
);

export default router;
