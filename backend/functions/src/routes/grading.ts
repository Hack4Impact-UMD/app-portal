import {
  FirestoreCollection,
  GradingJobStatus,
  PermissionRole,
} from "@app-portal/shared/constants";
import type { GradingJobDataInternal } from "@app-portal/shared/types";
import { submitGradingJobSchema } from "@app-portal/shared/types";
import axios from "axios";
import type { Response, Request } from "express";
import { Router } from "express";
import { Timestamp } from "firebase-admin/firestore";
import { logger } from "firebase-functions";
import { v4 as uuidv4 } from "uuid";

import { db } from "../index";
import {
  isAuthenticated,
  hasRoles,
  getUserById,
} from "../middleware/authentication";
import {
  computeRetryAfter,
  gradingRateLimiter,
  RATE_LIMITER_MAX_JOBS,
  RATE_LIMITER_WINDOW_MS,
} from "../middleware/rateLimiter";
import { validateSchema } from "../middleware/validation";
import type { ApplicationResponse } from "../models/appResponse";
import type { GradingJobPublic } from "../models/autograder";
import type { GradingTaskPayload } from "../utils/cloudTasks";
import { publishGradingTask } from "../utils/cloudTasks";
import { appCollection } from "../utils/firestore";

const router = Router();

router.post(
  "/submit",
  [
    isAuthenticated,
    hasRoles([
      PermissionRole.Applicant,
      PermissionRole.Board,
      PermissionRole.SuperReviewer,
    ]),
    validateSchema(submitGradingJobSchema),
    gradingRateLimiter,
  ],
  async (req: Request, res: Response) => {
    try {
      const { responseId, repoURL } = req.body;
      const userId = req.token?.uid;
      const user = await getUserById(userId ?? "");

      if (!userId || !user) {
        return res.status(401).send("Unauthorized");
      }

      logger.info(`Received autograder request for responseId ${responseId}`);

      const applicationResponseCollection = appCollection(
        FirestoreCollection.ApplicationResponses,
      );
      const gradingJobsPublicCollection = appCollection(
        FirestoreCollection.GradingJobsPublic,
      );
      const gradingJobsInternalCollection = appCollection(
        FirestoreCollection.GradingJobsInternal,
      );

      const responseDoc = await applicationResponseCollection
        .doc(responseId)
        .get();

      if (!responseDoc.exists) {
        logger.warn(`Response ${responseId} not found`);
        return res.status(404).send("Application response not found");
      }

      const responseData: ApplicationResponse | undefined = responseDoc.data();
      if (!responseData) {
        logger.warn(
          `Attempted to retrieve response with id: ${responseId} unsuccessfully`,
        );
        return res.status(404).send("Application response not found");
      }

      const isOwner = responseData.userId === userId;
      const isAdmin = [
        PermissionRole.Board,
        PermissionRole.SuperReviewer,
      ].includes(user.role);

      if (!isOwner && !isAdmin) {
        logger.warn(
          `User ${userId} attempted to submit grading for response ${responseId} they don't own`,
        );
        return res
          .status(403)
          .send(
            "You do not have permission to submit an autograder request for this application",
          );
      }

      const jobId = uuidv4();
      const now = Timestamp.now();
      const testRepo = "https://github.com/Hack4Impact-UMD/FAKE_REPO"; // TODO: replace with real repo

      // NOTE: cloud tasks publishing is outside this transaction right now, so docs may be created and left even if publish fails
      const txResult = await db.runTransaction(async (transaction) => {
        // validation: exit if user has existing running job
        const existingJobsSnapshot = await transaction.get(
          gradingJobsPublicCollection.where("responseId", "==", responseId),
        );

        const runningJobs = existingJobsSnapshot.docs.filter((doc) => {
          const status = doc.data().status;
          return (
            status !== GradingJobStatus.Completed &&
            status !== GradingJobStatus.Failed
          );
        });

        if (runningJobs.length > 0) {
          return { type: "duplicate" as const };
        }

        // rate limit: enforce atomically here as a backstop against concurrent
        // submits that could both pass the preflight middleware check
        const windowStart = now.toMillis() - RATE_LIMITER_WINDOW_MS;
        const recentStartedMs = existingJobsSnapshot.docs
          .map((doc) => doc.data().started.toMillis())
          .filter((startedMs) => startedMs >= windowStart);

        if (recentStartedMs.length >= RATE_LIMITER_MAX_JOBS) {
          return { type: "rate_limited" as const, recentStartedMs };
        }

        // create: job docs and cloud tasks job
        const publicJob: GradingJobPublic = {
          id: jobId,
          responseId,
          repoURL,
          status: GradingJobStatus.Queued,
          score: 0,
          totalTests: 0, // TODO: fetch to real repo's # of tests
          completedTests: 0,
          started: now,
          updated: now,
          suiteResults: {},
          publicTests: {},
        };

        const internalJob: GradingJobDataInternal = {
          id: jobId,
          testRepo,
          buildLog: "",
          installLog: "",
          playwrightLog: "",
          tests: {},
        };

        transaction.set(gradingJobsPublicCollection.doc(jobId), publicJob);
        transaction.set(gradingJobsInternalCollection.doc(jobId), internalJob);

        return { type: "created" as const };
      });

      if (txResult.type === "duplicate") {
        logger.info(`Found existing running job for response ${responseId}`);
        return res
          .status(409)
          .send("A grading job is already in progress for this application.");
      }

      if (txResult.type === "rate_limited") {
        logger.warn(
          `Rate limit hit for response ${responseId} during transaction`,
        );
        const { retryAtMs, retryInSeconds, retryInMinutes } = computeRetryAfter(
          txResult.recentStartedMs,
        );
        res.set("Retry-After", String(retryInSeconds));
        return res
          .status(429)
          .send(
            `Too many grading jobs submitted for this application. ` +
              `You can submit another request in about ${retryInMinutes} ` +
              `minute${retryInMinutes === 1 ? "" : "s"} ` +
              `(after ${new Date(retryAtMs).toISOString()}).`,
          );
      }

      logger.info(`Created Firestore documents for job ${jobId}`);
      const payload: GradingTaskPayload = {
        jobId,
        responseId,
        repoURL,
        testRepo,
      };

      if (process.env.FUNCTIONS_EMULATOR === "true") {
        // no await here bc we want to exit early, leave the job running
        axios
          .post(
            process.env.PROFESSOR_URL ?? "http://localhost:8000/grade",
            payload,
          )
          .then(() => {
            logger.info(
              `Successfully made grading request locally for job ${jobId}`,
            );
          })
          .catch(async (err) => {
            logger.error(
              `Failed to make grading request locally for job ${jobId}: ${err}`,
            );
            // mark the job failed so it doesn't stay stuck in Queued and count
            // against the response's rate limit on subsequent retries
            await gradingJobsPublicCollection
              .doc(jobId)
              .update({
                status: GradingJobStatus.Failed,
                updated: Timestamp.now(),
              })
              .catch((updateErr) => {
                logger.error(
                  `Failed to mark job ${jobId} as failed: ${updateErr}`,
                );
              });
          });
      } else {
        let taskName: string;
        try {
          taskName = await publishGradingTask(payload);
        } catch (err) {
          // mark the job failed so it doesn't stay stuck in Queued and count
          // against the response's rate limit on subsequent retries
          await gradingJobsPublicCollection.doc(jobId).update({
            status: GradingJobStatus.Failed,
            updated: Timestamp.now(),
          });
          throw err;
        }

        logger.info(`Successfully published task ${taskName} for job ${jobId}`);
      }

      return res.status(200).json({
        status: "success",
        message: "Grading job queued successfully",
        jobId,
      });
    } catch (error) {
      logger.error("Failed to submit grading job:", error);
      return res.status(500).send("Failed to submit grading job");
    }
  },
);

export default router;
