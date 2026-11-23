import { ApplicantRole, ApplicationStatus } from "@app-portal/shared/constants";
import type {
  AppReviewAssignment,
  ApplicationReviewData,
} from "@app-portal/shared/types";

import type { ApplicationResponse } from "../models/appResponse";
import type { UserProfile } from "../models/user";

export type AutoAssignmentPlanItem = {
  applicantName: string;
  applicantId: string;
  applicationResponseId: string;
  formId: string;
  reviewer1?: {
    name: string;
    id: string;
    isExisting: boolean;
  };
  reviewer2?: {
    name: string;
    id: string;
    isExisting: boolean;
  };
  skipped: boolean;
  skipReason?: string;
};

type ReviewerWorkload = {
  reviewerId: string;
  name: string;
  currentAssignments: number;
  completedAssignments: number;
};

function buildReviewerWorkloadMap(
  reviewers: UserProfile[],
  assignments: AppReviewAssignment[],
  allReviewData: ApplicationReviewData[],
): Map<string, ReviewerWorkload> {
  const workloadMap = new Map<string, ReviewerWorkload>();
  for (const r of reviewers) {
    workloadMap.set(r.id, {
      reviewerId: r.id,
      name: `${r.firstName} ${r.lastName}`,
      currentAssignments: 0,
      completedAssignments: 0,
    });
  }

  for (const a of assignments) {
    const w = workloadMap.get(a.reviewerId);
    if (!w) continue;
    w.currentAssignments += 1;
  }

  for (const reviewData of allReviewData) {
    if (reviewData.submitted) {
      const w = workloadMap.get(reviewData.reviewerId);
      if (w) {
        w.completedAssignments += 1;
      }
    }
  }

  return workloadMap;
}

function sortReviewersByPriority(
  workloadMap: Map<string, ReviewerWorkload>,
): ReviewerWorkload[] {
  const reviewers = Array.from(workloadMap.values());

  return reviewers.sort((a, b) => {
    if (a.currentAssignments !== b.currentAssignments) {
      return a.currentAssignments - b.currentAssignments;
    }

    if (a.completedAssignments !== b.completedAssignments) {
      return b.completedAssignments - a.completedAssignments;
    }

    return a.reviewerId.localeCompare(b.reviewerId);
  });
}

function matchResponseToAssignments(
  assignments: AppReviewAssignment[],
  role: ApplicantRole,
): Map<string, AppReviewAssignment[]> {
  const map = new Map<string, AppReviewAssignment[]>();

  for (const a of assignments) {
    if (a.forRole !== role) continue;

    const key = a.applicationResponseId;

    const arr = map.get(key);
    if (arr) {
      arr.push(a);
    } else {
      map.set(key, [a]);
    }
  }

  return map;
}

function assignUpToTwoReviewers(
  applicantName: string,
  applicantId: string,
  applicationResponseId: string,
  existingAssignments: AppReviewAssignment[], // expected .length <= 1
  workloadMap: Map<string, ReviewerWorkload>,
  formId: string,
): AutoAssignmentPlanItem {
  const baseItem = {
    applicantName,
    applicantId,
    applicationResponseId,
    formId,
  };

  const existingReviewerId = existingAssignments[0]?.reviewerId;

  // skip if we don't have workload for existing reviewer (smth wrong)
  if (existingReviewerId && !workloadMap.has(existingReviewerId)) {
    return {
      ...baseItem,
      skipped: true,
      skipReason: "Existing reviewer not found",
    };
  }

  const needed = existingReviewerId ? 1 : 2;

  // pick highest priority reviewers while skipping existing reviewer
  const sorted = sortReviewersByPriority(workloadMap);
  const picked: ReviewerWorkload[] = [];
  for (const r of sorted) {
    if (existingReviewerId && r.reviewerId === existingReviewerId) continue;
    picked.push(r);
    if (picked.length === needed) break;
  }

  // skip if we can't find enough reviewers
  if (picked.length < needed) {
    const existing = existingReviewerId
      ? workloadMap.get(existingReviewerId)!
      : undefined;

    return {
      ...baseItem,
      reviewer1: existing
        ? { name: existing.name, id: existing.reviewerId, isExisting: true }
        : undefined,
      skipped: true,
      skipReason: "Not enough reviewers available",
    };
  }

  for (const r of picked) {
    workloadMap.get(r.reviewerId)!.currentAssignments += 1;
  }

  // build output for when there is a pre-existing reviewer
  if (existingReviewerId) {
    const existing = workloadMap.get(existingReviewerId)!;
    return {
      ...baseItem,
      reviewer1: {
        name: existing.name,
        id: existing.reviewerId,
        isExisting: true,
      },
      reviewer2: {
        name: picked[0].name,
        id: picked[0].reviewerId,
        isExisting: false,
      },
      skipped: false,
    };
  }

  // build output otherwise
  return {
    ...baseItem,
    reviewer1: {
      name: picked[0].name,
      id: picked[0].reviewerId,
      isExisting: false,
    },
    reviewer2: {
      name: picked[1].name,
      id: picked[1].reviewerId,
      isExisting: false,
    },
    skipped: false,
  };
}

// auto-assignment algo for bootcamp
// not performance oriented right now! should use a heap instead of O(n) sorts
export function calculateBootcampAssignmentPlan(
  formId: string,
  {
    allApplications,
    allReviewers,
    usersById,
    assignments,
    reviewData,
  }: {
    allApplications: ApplicationResponse[];
    allReviewers: UserProfile[];
    usersById: Map<string, UserProfile>;
    assignments: AppReviewAssignment[];
    reviewData: ApplicationReviewData[];
  },
  exemptReviewerIds: string[],
): AutoAssignmentPlanItem[] {
  const exemptSet = new Set(exemptReviewerIds);
  const reviewers = allReviewers.filter((r) => !exemptSet.has(r.id));

  const consideredApplications = allApplications.filter(
    (app) =>
      app.rolesApplied.includes(ApplicantRole.Bootcamp) &&
      (app.status === ApplicationStatus.Submitted ||
        app.status === ApplicationStatus.UnderReview),
  );

  const workloadMap = buildReviewerWorkloadMap(
    reviewers,
    assignments,
    reviewData,
  );

  const responseToAssignments = matchResponseToAssignments(
    assignments,
    ApplicantRole.Bootcamp,
  );

  const applicationsWithAssignments = consideredApplications.map((app) => {
    const applicantUser = usersById.get(app.userId);
    if (!applicantUser) {
      throw new Error(`User with id ${app.userId} not found`);
    }

    return {
      app,
      assignments: responseToAssignments.get(app.id) ?? [],
      applicantName: `${applicantUser.firstName} ${applicantUser.lastName}`,
    };
  });

  const needsReviewers = applicationsWithAssignments.filter(
    (item) => item.assignments.length < 2,
  );

  const plan: AutoAssignmentPlanItem[] = [];

  for (const { app, assignments, applicantName } of needsReviewers) {
    const planItem = assignUpToTwoReviewers(
      applicantName,
      app.userId,
      app.id,
      assignments,
      workloadMap,
      formId,
    );
    plan.push(planItem);
  }

  return plan;
}
