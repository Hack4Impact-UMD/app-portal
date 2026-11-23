import { TRPCError } from "@trpc/server";
import { Timestamp } from "firebase-admin/firestore";
import { logger } from "firebase-functions";

import type { ApplicationForm } from "../models/appForm";
import type { ApplicationResponse } from "../models/appResponse";
import type { UserProfile } from "../models/user";
import { getForm } from "../services/forms";
import { listJobsStartedSince } from "../services/gradingJobs";
import { getResponse } from "../services/responses";
import { canRespondToForm } from "./access";
import { RateLimitError } from "./errors";

// The persisted response's applicationFormId is the source of truth for which
// form governs this request — a caller could otherwise supply an
// applicationFormId for a form they're invited to while acting on a response
// that actually belongs to a different form.
export async function assertCanRespondToForm(
  uid: string,
  user: UserProfile | undefined,
  responseId: string | undefined,
  inputFormId: string | undefined,
) {
  if (!user) {
    logger.error(`assertCanRespondToForm: User with id ${uid} not found!`);
    throw new TRPCError({ code: "FORBIDDEN" });
  }

  let existingResponse: ApplicationResponse | undefined;
  let form: ApplicationForm | undefined;
  let formId: string | undefined;

  try {
    existingResponse = responseId ? await getResponse(responseId) : undefined;
    // No existing response yet (e.g. first save): fall back to the
    // caller-supplied form ID since there's no canonical one to check against.
    formId = existingResponse?.applicationFormId ?? inputFormId;
    if (formId) form = await getForm(formId);
  } catch (error) {
    logger.error("assertCanRespondToForm: Firestore lookup failed", error);
    throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", cause: error });
  }

  if (existingResponse && inputFormId && inputFormId !== formId) {
    logger.warn(
      `assertCanRespondToForm: User ${uid} supplied form ${inputFormId} which does not match response ${responseId}'s form ${formId}`,
    );
    throw new TRPCError({ code: "FORBIDDEN" });
  }

  if (!canRespondToForm(user, formId, form)) {
    logger.warn(
      `assertCanRespondToForm: User ${uid} has role ${user.role} and is not invited to form ${formId}`,
    );
    throw new TRPCError({ code: "FORBIDDEN" });
  }
}

// Maximum number of grading jobs allowed per response within the rate limit window.
export const RATE_LIMITER_MAX_JOBS = 5;
// Length of the rate limit window in milliseconds (30 minutes).
export const RATE_LIMITER_WINDOW_MS = 30 * 60 * 1000;

// Given the start times (ms) of the jobs currently in the window, returns when
// the caller may retry. The caller is over the cap by (count - MAX_JOBS + 1)
// jobs, so the count drops below the cap RATE_LIMITER_WINDOW_MS after the job at
// index (count - MAX_JOBS) (sorted oldest-first) started.
function computeRetryAfter(startedMs: number[]) {
  const sorted = [...startedMs].sort((a, b) => a - b);
  const unblockIndex = sorted.length - RATE_LIMITER_MAX_JOBS;
  const retryAtMs = sorted[unblockIndex] + RATE_LIMITER_WINDOW_MS;
  const retryInSeconds = Math.max(
    0,
    Math.ceil((retryAtMs - Date.now()) / 1000),
  );
  const retryInMinutes = Math.ceil(retryInSeconds / 60);
  return { retryAtMs, retryInSeconds, retryInMinutes };
}

export function gradingRateLimitError(
  startedMs: number[],
  setHeader: (name: string, value: string) => void,
) {
  const { retryAtMs, retryInSeconds, retryInMinutes } =
    computeRetryAfter(startedMs);
  setHeader("Retry-After", String(retryInSeconds));

  const message =
    `Too many grading jobs submitted for this application. ` +
    `You can submit another request in about ${retryInMinutes} ` +
    `minute${retryInMinutes === 1 ? "" : "s"} ` +
    `(after ${new Date(retryAtMs).toISOString()}).`;

  return new TRPCError({
    code: "TOO_MANY_REQUESTS",
    message,
    cause: new RateLimitError(message, retryAtMs, retryInMinutes),
  });
}

// Limits how many grading jobs may be submitted for a single response within a
// rolling time window.
export async function assertGradingRateLimit(
  responseId: string,
  setHeader: (name: string, value: string) => void,
) {
  const windowStart = Timestamp.fromMillis(Date.now() - RATE_LIMITER_WINDOW_MS);

  const recentJobs = await listJobsStartedSince(responseId, windowStart);

  if (recentJobs.length >= RATE_LIMITER_MAX_JOBS) {
    logger.warn(
      `gradingRateLimiter: response ${responseId} exceeded the rate limit ` +
        `(${recentJobs.length} jobs in the last 30 minutes)`,
    );
    throw gradingRateLimitError(
      recentJobs.map((job) => job.started.toMillis()),
      setHeader,
    );
  }
}
