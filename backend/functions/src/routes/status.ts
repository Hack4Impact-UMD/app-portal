import type { Request, Response } from "express";
import { Router } from "express";
import { hasRoles, isAuthenticated } from "../middleware/authentication";
import { db } from "..";
import type { CollectionReference } from "firebase-admin/firestore";
import { ReviewStatus } from "@app-portal/shared/constants";
import { DecisionConfirmationSchema } from "@app-portal/shared/types";
import type {
  DecisionConfirmation,
  InternalApplicationStatus,
} from "@app-portal/shared/types";
import type { ApplicationForm } from "../models/appForm";
import type { ApplicationResponse } from "../models/appResponse";
import { logger } from "firebase-functions";
import { validateSchema } from "../middleware/validation";
import { PermissionRole } from "../models/user";

const router = Router();
const APPLICATION_STATUS_COLLECTION = "app-status";
const APPLICATION_FORMS_COLLECTION = "application-forms";
const APPLICATION_RESPONSE_COLLECTION = "application-responses";
const DECISION_STATUS_COLLECTION = "decision-status";

async function decisionsReleased(formId: string) {
  const form = (
    await db.collection(APPLICATION_FORMS_COLLECTION).doc(formId).get()
  ).data() as ApplicationForm;
  if (!form) throw new Error(`Form ${formId} not found!`);
  return form.decisionsReleased;
}

router.get(
  "/:responseId/:role",
  [isAuthenticated],
  async (req: Request, res: Response) => {
    const response = req.params.responseId as string;
    const role = req.params.role as string;

    const responseDoc = (
      await db.collection(APPLICATION_RESPONSE_COLLECTION).doc(response).get()
    ).data() as ApplicationResponse;

    if (!responseDoc) {
      res.status(404).send();
      return;
    }

    if (req.token?.sub !== responseDoc.userId) {
      res.status(401).send();
      return;
    }

    const statusCollection = db.collection(
      APPLICATION_STATUS_COLLECTION,
    ) as CollectionReference<InternalApplicationStatus>;
    const status = await statusCollection
      .where("role", "==", role)
      .where("responseId", "==", response)
      .get();

    const data = status.docs[0]?.data() ?? undefined;
    if (!data) {
      res.status(404).send();
      return;
    }

    if (await decisionsReleased(responseDoc.applicationFormId)) {
      res.json({
        id: status.docs[0].id,
        status: data.status,
        role: data.role,
        released: true,
      });
    } else {
      let publicStatus:
        | ReviewStatus.UnderReview
        | ReviewStatus.Interview
        | "decided";
      if (data.status === ReviewStatus.Interview) {
        publicStatus = ReviewStatus.Interview;
      } else if (
        data.status === ReviewStatus.Accepted ||
        data.status === ReviewStatus.Waitlisted ||
        data.status === ReviewStatus.Denied
      ) {
        publicStatus = "decided";
      } else {
        publicStatus = ReviewStatus.UnderReview;
      }

      res.json({
        id: status.docs[0].id,
        status: publicStatus,
        role: data.role,
        released: false,
      });
    }
  },
);

router.post(
  "/decision",
  [
    isAuthenticated,
    hasRoles([PermissionRole.Applicant]),
    validateSchema(DecisionConfirmationSchema),
  ],
  async (req: Request, res: Response) => {
    try {
      console.log("Request received:", req.body); // Log the incoming request body

      const decisionStatusCollection = db.collection(
        DECISION_STATUS_COLLECTION,
      ) as CollectionReference<DecisionConfirmation>;

      const input = req.body as DecisionConfirmation;
      const { responseId, userId, internalStatusId } = input;
      const uid = req.token!.uid;

      // Check if user is editing their own decision
      if (userId !== uid) {
        logger.warn("User is not editing their own decision");
        return res
          .status(401)
          .send("You cannot edit another person's decision");
      }

      // Check if confirmation already exists for this responseId
      const existingConfirmation = await decisionStatusCollection
        .where("responseId", "==", responseId)
        .get();
      if (!existingConfirmation.empty) {
        logger.warn(
          `Confirmation already exists for responseId: ${responseId}`,
        );
        return res
          .status(400)
          .send("Confirmation already exists for this responseId.");
      }

      // Look up applicant’s internal decision in app-status
      const statusCollection = db.collection(
        APPLICATION_STATUS_COLLECTION,
      ) as CollectionReference<InternalApplicationStatus>;
      const statusDocs = await statusCollection
        .where("id", "==", internalStatusId)
        .get();

      if (statusDocs.empty) {
        logger.warn(
          `No app-status record found for internalStatusId: ${internalStatusId}`,
        );
        return res.status(403).send("No decision found for this response.");
      }

      const internalStatus = statusDocs.docs[0].data();

      if (internalStatus.status !== ReviewStatus.Accepted) {
        logger.warn(
          `User ${userId} attempted to confirm but was not accepted. Status ID: ${internalStatusId}.`,
        );
        return res
          .status(403)
          .send("You cannot confirm because you were not accepted.");
      }

      // Create ConfirmationStatus document
      const confirmationId = `${responseId}_${userId}`;
      const docRef = decisionStatusCollection.doc(confirmationId);

      await docRef.set(input);

      logger.info(`Created confirmation for responseId: ${responseId}`);
      return res
        .status(200)
        .send({ message: "Confirmation recorded successfully." });
    } catch (error) {
      logger.error("Error creating confirmation:", error);
      return res
        .status(500)
        .send(error instanceof Error ? error.message : "Unknown error");
    }
  },
);

export default router;
