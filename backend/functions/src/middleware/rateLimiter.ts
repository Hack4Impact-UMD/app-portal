import { FirestoreCollection } from "@app-portal/shared/constants";
import type { Request, Response, NextFunction } from "express";
import { Timestamp } from "firebase-admin/firestore";
import { logger } from "firebase-functions";

import { appCollection } from "../utils/firestore";

// Maximum number of grading jobs allowed per response within the rate limit window.
const RATE_LIMITER_MAX_JOBS = 5;
// Length of the rate limit window in milliseconds (30 minutes).
const RATE_LIMITER_WINDOW_MS = 30 * 60 * 1000;

// Limits how many grading jobs may be submitted for a single response within a
// rolling time window. Must be used after validateSchema so req.body.responseId
// is present.
export async function gradingRateLimiter(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const { responseId } = req.body;

  if (!responseId) {
    logger.warn(
      "gradingRateLimiter middleware: missing responseId. This middleware must be used after validateSchema!",
    );
    res.status(400).send("Missing responseId");
    return;
  }

  try {
    const gradingJobsPublicCollection = appCollection(
      FirestoreCollection.GradingJobsPublic,
    );

    const windowStart = Timestamp.fromMillis(Date.now() - RATE_LIMITER_WINDOW_MS);

    const recentJobsSnapshot = await gradingJobsPublicCollection
      .where("responseId", "==", responseId)
      .where("started", ">=", windowStart)
      .get();

    if (recentJobsSnapshot.size >= RATE_LIMITER_MAX_JOBS) {
      logger.warn(
        `gradingRateLimiter: response ${responseId} exceeded the rate limit ` +
          `(${recentJobsSnapshot.size} jobs in the last 30 minutes)`,
      );

      // The user can submit again once the oldest job in the window ages out of
      // it, i.e. RATE_LIMITER_WINDOW_MS after that job started.
      const oldestStartedMs = Math.min(
        ...recentJobsSnapshot.docs.map((doc) => doc.data().started.toMillis()),
      );
      const retryAtMs = oldestStartedMs + RATE_LIMITER_WINDOW_MS;
      const retryInSeconds = Math.max(
        0,
        Math.ceil((retryAtMs - Date.now()) / 1000),
      );
      const retryInMinutes = Math.ceil(retryInSeconds / 60);

      res.set("Retry-After", String(retryInSeconds));
      res
        .status(429)
        .send(
          `Too many grading jobs submitted for this application. ` +
            `You can submit another request in about ${retryInMinutes} ` +
            `minute${retryInMinutes === 1 ? "" : "s"} ` +
            `(after ${new Date(retryAtMs).toISOString()}).`,
        );
      return;
    }

    next();
  } catch (error) {
    logger.error("gradingRateLimiter middleware failed:", error);
    res.status(500).send("Failed to check grading job rate limit");
  }
}
