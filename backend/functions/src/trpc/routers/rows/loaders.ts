import type { ApplicantRole } from "@app-portal/shared/constants";
import { ApplicationStatus } from "@app-portal/shared/constants";
import type { InternalApplicationStatus } from "@app-portal/shared/types";
import {
  bestGradingScore,
  countPreviouslyApplied,
} from "@app-portal/shared/utils";

import { listForms } from "../../../services/forms";
import { listJobsForResponses } from "../../../services/gradingJobs";
import {
  listResponsesForForm,
  listResponsesForUsers,
} from "../../../services/responses";
import { listStatusesForResponses } from "../../../services/statuses";
import { groupBy } from "../../../utils/batch";

export async function loadExpandedSubmittedResponses(formId: string) {
  const responses = await listResponsesForForm(formId);
  return responses
    .filter((app) => app.status !== ApplicationStatus.InProgress)
    .flatMap((app) => app.rolesApplied.map((role) => ({ app, role }) as const));
}

export function responseRoleKey(responseId: string, role: ApplicantRole) {
  return `${responseId}:${role}`;
}

export async function loadStatusesByResponseRole(responseIds: string[]) {
  const statuses = await listStatusesForResponses(responseIds);
  const byKey = new Map<string, InternalApplicationStatus>();
  for (const status of statuses) {
    const key = responseRoleKey(status.responseId, status.role);
    if (!byKey.has(key)) byKey.set(key, status);
  }
  return byKey;
}

export async function loadBestGradingScores(responseIds: string[]) {
  const jobs = await listJobsForResponses(responseIds);
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
    listResponsesForUsers(userIds),
    listForms(),
  ]);

  const formActive = new Map<string, boolean>();
  for (const form of forms) {
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
