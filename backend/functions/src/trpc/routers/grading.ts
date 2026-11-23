import {
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
import { Timestamp } from "firebase-admin/firestore";
import { logger } from "firebase-functions";
import { v4 as uuidv4 } from "uuid";
import { z } from "zod";

import type { GradingJobPublic } from "../../models/autograder";
import { runTransaction } from "../../services/db";
import {
  createJob,
  listJobsForResponse,
  listJobsForResponseInTx,
  markJobFailed,
} from "../../services/gradingJobs";
import type { GradingTaskPayload } from "../../utils/cloudTasks";
import { publishGradingTask } from "../../utils/cloudTasks";
import { canSubmitGrading } from "../access";
import { forbidden } from "../errors";
import {
  assertGradingRateLimit,
  gradingRateLimitError,
  RATE_LIMITER_MAX_JOBS,
  RATE_LIMITER_WINDOW_MS,
} from "../guards";
import { authedProcedure, requireUser, roleProcedure, router } from "../init";
import {
  requireForm,
  requireReadableResponse,
  requireResponse,
} from "../required";

// Publishes a grading task to the Professor grader. In the emulator this POSTs
// directly to the local grader and returns immediately (fire-and-forget); in
// production it enqueues a Cloud Task. On publish failure the job is marked
// Failed so it doesn't stay stuck in Queued.
async function publishGradingJob(payload: GradingTaskPayload) {
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
        await markJobFailed(jobId).catch((updateErr) => {
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
    await markJobFailed(jobId);
    throw err;
  }
}

export const gradingRouter = router({
  listForResponse: authedProcedure
    .input(z.object({ responseId: z.string().min(1) }))
    .query(async ({ input, ctx }) => {
      const user = await requireUser(ctx);
      await requireReadableResponse(user, input.responseId);
      return listJobsForResponse(input.responseId);
    }),

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

      const responseData = await requireResponse(responseId);
      const form = await requireForm(responseData.applicationFormId);

      if (!canSubmitGrading(user, responseData)) {
        throw forbidden(
          `User ${userId} attempted to submit grading for response ${responseId} they don't own`,
          "You do not have permission to submit an autograder request for this application",
        );
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
      const txResult = await runTransaction(async (transaction) => {
        // validation: exit if user has existing running job
        const existingJobs = await listJobsForResponseInTx(
          responseId,
          transaction,
        );

        const runningJobs = existingJobs.filter(({ status }) => {
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
        const recentStartedMs = existingJobs
          .map((job) => job.started.toMillis())
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

        createJob(publicJob, internalJob, transaction);

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
      await publishGradingJob({
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

      await runTransaction(async (tx) => createJob(publicJob, internalJob, tx));

      logger.info(`Created Firestore documents for standalone job ${jobId}`);

      const payload: GradingTaskPayload = {
        jobId,
        responseId: STANDALONE_GRADING_RESPONSE_ID,
        repoURL,
        testRepo,
      };

      await publishGradingJob(payload);

      return {
        status: "success" as const,
        message: "Standalone grading job queued successfully",
        jobId,
      };
    }),
});
