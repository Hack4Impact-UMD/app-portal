import { Router, Request, Response } from "express";
import { db } from "../index";
import { logger } from "firebase-functions";
import { hasRoles, isAuthenticated } from "../middleware/authentication";
import { validateSchema } from "../middleware/validation";
import {
  InterviewData,
  interviewSchema,
  updateInterviewSchema,
} from "../models/appInterview";

const router = Router();
const INTERVIEW_COLLECTION = "interview-data";

// Create a new interview
router.post(
  "/",
  [
    isAuthenticated,
    hasRoles(["reviewer", "super-reviewer"]),
    validateSchema(interviewSchema),
  ],
  async (req: Request, res: Response) => {
    const input = req.body;
    const timestamp = new Date().toISOString();

    try {
      const interviewId = `${input.reviewerId}_${input.applicationId}`;
      const newInterview: InterviewData = {
        ...input,
        id: interviewId,
        createdAt: timestamp,
        updatedAt: timestamp,
      };

      const docRef = db.collection(INTERVIEW_COLLECTION).doc(interviewId);
      const existing = await docRef.get();

      if (existing.exists) {
        logger.warn(`Interview already exists for ID: ${interviewId}`);
        return res
          .status(400)
          .send("Interview already exists for this reviewer-application pair.");
      }

      await docRef.set(newInterview);
      logger.info(`Created Interview with ID: ${interviewId}`);

      return res.status(201).send(newInterview);
    } catch (error) {
      logger.error("Failed to create interview:", error);
      return res
        .status(500)
        .send(error instanceof Error ? error.message : "Unknown error");
    }
  },
);

// Update an existing interview
router.put(
  "/:id",
  [
    isAuthenticated,
    hasRoles(["reviewer", "super-reviewer"]),
    validateSchema(updateInterviewSchema),
  ],
  async (req: Request, res: Response) => {
    const interviewId = req.params.id;
    const updates = req.body;

    try {
      const docRef = db.collection(INTERVIEW_COLLECTION).doc(interviewId);
      const existing = await docRef.get();

      if (!existing.exists) {
        logger.warn(`Interview not found for ID: ${interviewId}`);
        return res.status(404).send("Interview not found.");
      }

      const updatedInterview = {
        ...existing.data(),
        ...updates,
        updatedAt: new Date().toISOString(),
      };

      await docRef.update(updatedInterview);
      logger.info(`Updated Interview with ID: ${interviewId}`);

      return res.status(200).send(updatedInterview);
    } catch (error) {
      logger.error("Failed to update interview:", error);
      return res
        .status(500)
        .send(error instanceof Error ? error.message : "Unknown error");
    }
  },
);

// Delete an interview
router.delete(
  "/:id",
  [isAuthenticated, hasRoles(["reviewer", "super-reviewer"])],
  async (req: Request, res: Response) => {
    const interviewId = req.params.id;

    try {
      const docRef = db.collection(INTERVIEW_COLLECTION).doc(interviewId);
      const existing = await docRef.get();

      if (!existing.exists) {
        logger.warn(`Interview not found for ID: ${interviewId}`);
        return res.status(404).send("Interview not found.");
      }

      await docRef.delete();
      logger.info(`Deleted Interview with ID: ${interviewId}`);

      return res
        .status(200)
        .send({ message: "Interview deleted successfully" });
    } catch (error) {
      logger.error("Failed to delete interview:", error);
      return res
        .status(500)
        .send(error instanceof Error ? error.message : "Unknown error");
    }
  },
);

export default router;
