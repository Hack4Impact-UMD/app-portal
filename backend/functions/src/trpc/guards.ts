import {
  FirestoreCollection,
  PermissionRole,
} from "@app-portal/shared/constants";
import { TRPCError } from "@trpc/server";
import { Timestamp } from "firebase-admin/firestore";
import { logger } from "firebase-functions";

import type { ApplicationForm } from "../models/appForm";
import type { ApplicationResponse } from "../models/appResponse";
import type { UserProfile } from "../models/user";
import { appCollection } from "../utils/firestore";
import { RateLimitError } from "./errors";

// Private forms can invite users of any role, so submitting/saving a
// response for one of those forms must be allowed for the invited user even
// if their role isn't Applicant. The persisted response's applicationFormId
// is the source of truth for which form governs this request — a caller
// could otherwise supply an applicationFormId for a form they're invited to
// while acting on a response that actually belongs to a different form.
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
    const responses = appCollection(FirestoreCollection.ApplicationResponses);
    existingResponse = responseId
      ? (await responses.doc(responseId).get()).data()
      : undefined;

    // No existing response yet (e.g. first save): fall back to the
    // caller-supplied form ID since there's no canonical one to check against.
    formId = existingResponse?.applicationFormId ?? inputFormId;

    if (formId) {
      const forms = appCollection(FirestoreCollection.ApplicationForms);
      form = (await forms.doc(formId).get()).data();
    }
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

  if (formId) {
    // A form ID that resolves to nothing is not a public form — without the
    // existence check `!form?.isPrivate` would wave through any applicant
    // pointing at a form that doesn't exist. Mirrors the `exists()` guard in
    // the Firestore rules.
    if (form && user.role === PermissionRole.Applicant && !form.isPrivate) {
      return;
    }
    if (form?.invitedUsers?.includes(uid)) {
      return;
    }
  } else if (user.role === PermissionRole.Applicant) {
    return;
  }

  logger.warn(
    `assertCanRespondToForm: User ${uid} has role ${user.role} and is not invited to form ${formId}`,
  );
  throw new TRPCError({ code: "FORBIDDEN" });
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

  const recentJobsSnapshot = await appCollection(
    FirestoreCollection.GradingJobsPublic,
  )
    .where("responseId", "==", responseId)
    .where("started", ">=", windowStart)
    .get();

  if (recentJobsSnapshot.size >= RATE_LIMITER_MAX_JOBS) {
    logger.warn(
      `gradingRateLimiter: response ${responseId} exceeded the rate limit ` +
        `(${recentJobsSnapshot.size} jobs in the last 30 minutes)`,
    );
    throw gradingRateLimitError(
      recentJobsSnapshot.docs.map((doc) => doc.data().started.toMillis()),
      setHeader,
    );
  }
}
