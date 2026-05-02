import { Router, Request, Response } from "express";
import { db } from "../index";
import { logger } from "firebase-functions";
// import * as admin from "firebase-admin";
import { hasRoles, isAuthenticated } from "../middleware/authentication";
import { validateSchema } from "../middleware/validation";
import { CollectionReference } from "firebase-admin/firestore";
import {
  ApplicationReviewData,
  reviewSchema,
  updateReviewSchema,
  ApplicationReviewForm,
} from "../models/appReview";

/* eslint new-cap: 0 */
const router = Router();
const APPLICATION_REVIEW_COLLECTION = db.collection(
  "review-data",
) as CollectionReference<ApplicationReviewData>;

router.post(
  "/review",
  [
    isAuthenticated,
    hasRoles(["reviewer", "super-reviewer"]),
    validateSchema(reviewSchema),
  ],
  async (req: Request, res: Response) => {
    const input = req.body as ApplicationReviewForm;

    try {
      //probably better to replace this with uuid, we'll see
      const reviewId = `${input.reviewerId}_${input.applicationResponseId}_${input.forRole.toString()}`;
      const newReview: ApplicationReviewData = {
        ...input,
        id: reviewId,
      };

      const docRef = APPLICATION_REVIEW_COLLECTION.doc(reviewId);
      const existing = await docRef.get();

      if (existing.exists) {
        logger.warn(`Review already exists for ID: ${reviewId}`);
        return res
          .status(400)
          .send("Review already exists for this reviewer-application pair.");
      }

      await docRef.set(newReview);
      logger.info(`Created Review with ID: ${reviewId}`);

      return res.status(201).send(newReview);
    } catch (error) {
      logger.error("Failed to create review:", error);
      return res
        .status(500)
        .send(error instanceof Error ? error.message : "Unknown error");
    }
  },
);

router.put(
  "/review/:id",
  [
    isAuthenticated,
    hasRoles(["reviewer", "super-reviewer"]),
    validateSchema(updateReviewSchema),
  ],
  async (req: Request, res: Response) => {
    const reviewId = req.params.id;
    const updates = req.body as Partial<ApplicationReviewData>;

    try {
      const docRef = APPLICATION_REVIEW_COLLECTION.doc(reviewId);
      const docSnap = await docRef.get();

      if (!docSnap.exists) {
        logger.warn(`Review ${reviewId} not found`);
        return res.status(404).send("Review not found");
      }

      delete updates.id;
      delete updates.reviewerId;
      delete updates.applicationResponseId;

      await docRef.update(updates);
      logger.info(`Updated Review ${reviewId}`);

      return res.status(200).send({ message: "Review updated successfully" });
    } catch (error) {
      logger.error("Failed to update review:", error);
      return res
        .status(500)
        .send(error instanceof Error ? error.message : "Unknown error");
    }
  },
);

router.delete(
  "/review/:id",
  [isAuthenticated, hasRoles(["reviewer", "super-reviewer"])],
  async (req: Request, res: Response) => {
    const reviewId = req.params.id;

    try {
      const docRef = APPLICATION_REVIEW_COLLECTION.doc(reviewId);
      const docSnap = await docRef.get();

      if (!docSnap.exists) {
        logger.warn(`Review ${reviewId} not found`);
        return res.status(404).send("Review not found");
      }

      await docRef.delete();
      logger.info(`Deleted Review ${reviewId}`);

      return res.status(200).send({ message: "Review deleted successfully" });
    } catch (error) {
      logger.error("Failed to delete review:", error);
      return res
        .status(500)
        .send(error instanceof Error ? error.message : "Unknown error");
    }
  },
);

export default router;
