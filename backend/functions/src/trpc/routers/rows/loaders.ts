import type { ApplicantRole } from "@app-portal/shared/constants";
import {
  ApplicationStatus,
  FirestoreCollection,
} from "@app-portal/shared/constants";
import type { InternalApplicationStatus } from "@app-portal/shared/types";
import {
  bestGradingScore,
  countPreviouslyApplied,
} from "@app-portal/shared/utils";
import { TRPCError } from "@trpc/server";

import type { ApplicationForm } from "../../../models/appForm";
import type { ApplicationResponse } from "../../../models/appResponse";
import { getDocsById, groupBy, queryWhereIn } from "../../../utils/batch";
import { appCollection } from "../../../utils/firestore";
import { REVIEW_CAPABLE_ROLES } from "./helpers";
import type { AnyUserProfile } from "./types";

export async function loadForm(formId: string): Promise<ApplicationForm> {
  const form = (
    await appCollection(FirestoreCollection.ApplicationForms).doc(formId).get()
  ).data();
  if (!form) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Form not found" });
  }
  return form;
}

export async function loadExpandedSubmittedResponses(formId: string) {
  const responses = (
    await appCollection(FirestoreCollection.ApplicationResponses)
      .where("applicationFormId", "==", formId)
      .get()
  ).docs.map((d) => d.data());

  return responses
    .filter((app) => app.status !== ApplicationStatus.InProgress)
    .flatMap((app) => app.rolesApplied.map((role) => ({ app, role }) as const));
}

export function responseRoleKey(responseId: string, role: ApplicantRole) {
  return `${responseId}:${role}`;
}

export async function loadStatusesByResponseRole(responseIds: string[]) {
  const statuses = await queryWhereIn(
    appCollection(FirestoreCollection.ApplicationStatus),
    "responseId",
    responseIds,
  );
  const byKey = new Map<string, InternalApplicationStatus>();
  for (const status of statuses) {
    const key = responseRoleKey(status.responseId, status.role);
    if (!byKey.has(key)) byKey.set(key, status);
  }
  return byKey;
}

export async function loadBestGradingScores(responseIds: string[]) {
  const jobs = await queryWhereIn(
    appCollection(FirestoreCollection.GradingJobsPublic),
    "responseId",
    responseIds,
  );
  const byResponse = groupBy(jobs, (j) => j.responseId);
  const scores = new Map<string, number | null>();
  for (const [responseId, group] of byResponse) {
    const newestFirst = [...group].sort(
      (a, b) => b.started.toMillis() - a.started.toMillis(),
    );
    scores.set(responseId, bestGradingScore(newestFirst));
  }
  return scores;
}

export async function loadPreviouslyAppliedCounts(userIds: string[]) {
  const [responses, forms] = await Promise.all([
    queryWhereIn(
      appCollection(FirestoreCollection.ApplicationResponses),
      "userId",
      userIds,
    ),
    appCollection(FirestoreCollection.ApplicationForms).get(),
  ]);

  const formActive = new Map<string, boolean>();
  for (const doc of forms.docs) {
    const form = doc.data();
    if (!formActive.has(form.id)) formActive.set(form.id, form.isActive);
  }

  const byUser = groupBy(responses, (r) => r.userId);
  const counts = new Map<string, number>();
  for (const userId of userIds) {
    counts.set(
      userId,
      countPreviouslyApplied(byUser.get(userId) ?? [], (formId) =>
        formActive.get(formId),
      ),
    );
  }
  return counts;
}

export async function loadUsers(ids: Iterable<string>) {
  return getDocsById(appCollection(FirestoreCollection.Users), ids) as Promise<
    Map<string, AnyUserProfile>
  >;
}

export async function loadReviewCapableUsers() {
  // NOTE: if the inactive field does not exist, querying on it never matches,
  // so inactive users are filtered here instead.
  return (
    await appCollection(FirestoreCollection.Users)
      .where("role", "in", REVIEW_CAPABLE_ROLES)
      .get()
  ).docs
    .map((d) => d.data() as AnyUserProfile)
    .filter((u) => !u.inactive);
}

export async function loadResponse(
  responseId: string,
): Promise<ApplicationResponse> {
  const response = (
    await appCollection(FirestoreCollection.ApplicationResponses)
      .doc(responseId)
      .get()
  ).data();
  if (!response) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Response not found!" });
  }
  return response;
}
