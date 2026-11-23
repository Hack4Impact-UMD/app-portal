import {
  FirestoreCollection,
  GradingJobStatus,
  PermissionRole,
  STANDALONE_GRADING_RESPONSE_ID,
} from "@app-portal/shared/constants";
import type { GradingJobDataInternal } from "@app-portal/shared/types";
import {
  submitGradingJobSchema,
  submitStandaloneGradingJobSchema,
} from "@app-portal/shared/types";
import { TRPCError } from "@trpc/server";
import axios from "axios";
import type { CollectionReference } from "firebase-admin/firestore";
import { Timestamp } from "firebase-admin/firestore";
import { logger } from "firebase-functions";
import { v4 as uuidv4 } from "uuid";

import { db } from "../../index";
import type { ApplicationForm } from "../../models/appForm";
import type { GradingJobPublic } from "../../models/autograder";
import type { GradingTaskPayload } from "../../utils/cloudTasks";
import { publishGradingTask } from "../../utils/cloudTasks";
import { appCollection } from "../../utils/firestore";
import {
  assertGradingRateLimit,
  gradingRateLimitError,
  RATE_LIMITER_MAX_JOBS,
  RATE_LIMITER_WINDOW_MS,
} from "../guards";
import { roleProcedure, router } from "../init";

// Publishes a grading task to the Professor grader. In the emulator this POSTs
// directly to the local grader and returns immediately (fire-and-forget); in
// production it enqueues a Cloud Task. On publish failure the job is marked
// Failed so it doesn't stay stuck in Queued.
async function publishGradingJob(
  gradingJobsPublicCollection: CollectionReference<GradingJobPublic>,
  payload: GradingTaskPayload,
) {
  const { jobId } = payload;

  if (process.env.FUNCTIONS_EMULATOR === "true") {
    // no await here bc we want to exit early, leave the job running
    axios
      .post(process.env.PROFESSOR_URL ?? "http://localhost:8000/grade", payload)
      .then(() => {
        logger.info(
          `Successfully made grading request locally for job ${jobId}`,
        );
      })
      .catch(async (err) => {
        logger.error(
          `Failed to make grading request locally for job ${jobId}: ${err}`,
        );
        // mark the job failed so it doesn't stay stuck in Queued
        await gradingJobsPublicCollection
          .doc(jobId)
          .update({
            status: GradingJobStatus.Failed,
            updated: Timestamp.now(),
          })
          .catch((updateErr) => {
            logger.error(`Failed to mark job ${jobId} as failed: ${updateErr}`);
          });
      });
    return;
  }

  try {
    const taskName = await publishGradingTask(payload);
    logger.info(`Successfully published task ${taskName} for job ${jobId}`);
  } catch (err) {
    // mark the job failed so it doesn't stay stuck in Queued
    await gradingJobsPublicCollection.doc(jobId).update({
      status: GradingJobStatus.Failed,
      updated: Timestamp.now(),
    });
    throw err;
  }
}

export const gradingRouter = router({
  submit: roleProcedure([
    PermissionRole.Applicant,
    PermissionRole.Board,
    PermissionRole.SuperReviewer,
  ])
    .input(submitGradingJobSchema)
    .mutation(async ({ input: { responseId, repoURL }, ctx }) => {
      const setHeader = (name: string, value: string) =>
        ctx.res.setHeader(name, value);
      await assertGradingRateLimit(responseId, setHeader);

      const userId = ctx.token.uid;
      const user = ctx.user;

      logger.info(`Received autograder request for responseId ${responseId}`);

      const gradingJobsPublicCollection = appCollection(
        FirestoreCollection.GradingJobsPublic,
      );
      const gradingJobsInternalCollection = appCollection(
        FirestoreCollection.GradingJobsInternal,
      );

      const responseData = (
        await appCollection(FirestoreCollection.ApplicationResponses)
          .doc(responseId)
          .get()
      ).data();

      if (!responseData) {
        logger.warn(`Response ${responseId} not found`);
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Application response not found",
        });
      }

      const formDoc = await appCollection(FirestoreCollection.ApplicationForms)
        .doc(responseData.applicationFormId)
        .get();

      if (!formDoc.exists) {
        logger.warn(`Form ${responseData.applicationFormId} not found`);
        throw new TRPCError({ code: "NOT_FOUND", message: "Form not found" });
      }

      const form: ApplicationForm = formDoc.data() as ApplicationForm;

      const isOwner = responseData.userId === userId;
      const isAdmin = [
        PermissionRole.Board,
        PermissionRole.SuperReviewer,
      ].includes(user.role);

      if (!isOwner && !isAdmin) {
        logger.warn(
          `User ${userId} attempted to submit grading for response ${responseId} they don't own`,
        );
        throw new TRPCError({
          code: "FORBIDDEN",
          message:
            "You do not have permission to submit an autograder request for this application",
        });
      }

      const jobId = uuidv4();
      const now = Timestamp.now();
      const testRepo = form.assessmentTestRepoPath;

      if (!testRepo) {
        logger.warn(`Form ${form.id} is not configured for autograding`);
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Application form is not configured for autograding",
        });
      }

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
        // submits that could both pass the preflight check
        const windowStart = now.toMillis() - RATE_LIMITER_WINDOW_MS;
        const recentStartedMs = existingJobsSnapshot.docs
          .map((doc) => doc.data().started.toMillis())
          .filter((startedMs) => startedMs >= windowStart);

        if (recentStartedMs.length >= RATE_LIMITER_MAX_JOBS) {
          return { type: "rate_limited" as const, recentStartedMs };
        }

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
        throw new TRPCError({
          code: "CONFLICT",
          message: "A grading job is already in progress for this application.",
        });
      }

      if (txResult.type === "rate_limited") {
        logger.warn(
          `Rate limit hit for response ${responseId} during transaction`,
        );
        throw gradingRateLimitError(txResult.recentStartedMs, setHeader);
      }

      logger.info(`Created Firestore documents for job ${jobId}`);
      await publishGradingJob(gradingJobsPublicCollection, {
        jobId,
        responseId,
        repoURL,
        testRepo,
      });

      return {
        status: "success" as const,
        message: "Grading job queued successfully",
        jobId,
      };
    }),

  // Submit a standalone grading job: grade an arbitrary assessment repo against
  // a test repo, with no application response attached. Admin-only. Standalone
  // jobs share a sentinel responseId, so the response-scoped rate limiter and
  // duplicate check don't apply and aren't run here.
  submitStandalone: roleProcedure([
    PermissionRole.Board,
    PermissionRole.SuperReviewer,
  ])
    .input(submitStandaloneGradingJobSchema)
    .mutation(async ({ input: { repoURL, testRepo } }) => {
      logger.info(
        `Received standalone autograder request for repo ${repoURL} against tests ${testRepo}`,
      );

      const gradingJobsPublicCollection = appCollection(
        FirestoreCollection.GradingJobsPublic,
      );
      const gradingJobsInternalCollection = appCollection(
        FirestoreCollection.GradingJobsInternal,
      );

      const jobId = uuidv4();
      const now = Timestamp.now();

      const publicJob: GradingJobPublic = {
        id: jobId,
        responseId: STANDALONE_GRADING_RESPONSE_ID,
        repoURL,
        status: GradingJobStatus.Queued,
        score: 0,
        totalTests: 0,
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

      await db.runTransaction(async (tx) => {
        tx.set(gradingJobsPublicCollection.doc(jobId), publicJob);
        tx.set(gradingJobsInternalCollection.doc(jobId), internalJob);
      });

      logger.info(`Created Firestore documents for standalone job ${jobId}`);

      const payload: GradingTaskPayload = {
        jobId,
        responseId: STANDALONE_GRADING_RESPONSE_ID,
        repoURL,
        testRepo,
      };

      await publishGradingJob(gradingJobsPublicCollection, payload);

      return {
        status: "success" as const,
        message: "Standalone grading job queued successfully",
        jobId,
      };
    }),
});
