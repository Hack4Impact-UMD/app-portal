import {
  FirestoreCollection,
  PermissionRole,
} from "@app-portal/shared/constants";
import {
  calculateReviewScore,
  isInternalApplicant,
} from "@app-portal/shared/utils";
import { z } from "zod";

import type { ReviewCapableProfile } from "../../../models/user";
import { groupBy, queryWhereIn } from "../../../utils/batch";
import { appCollection } from "../../../utils/firestore";
import { roleProcedure } from "../../init";
import { scoreWarning, requireUser } from "./helpers";
import {
  loadForm,
  loadExpandedSubmittedResponses,
  responseRoleKey,
  loadStatusesByResponseRole,
  loadBestGradingScores,
  loadPreviouslyAppliedCounts,
  loadUsers,
} from "./loaders";

export const underReview = roleProcedure([
  PermissionRole.SuperReviewer,
  PermissionRole.Board,
])
  .input(z.object({ formId: z.string() }))
  .query(async ({ input: { formId } }) => {
    const [form, applications] = await Promise.all([
      loadForm(formId),
      loadExpandedSubmittedResponses(formId),
    ]);

    const responseIds = [...new Set(applications.map(({ app }) => app.id))];
    const userIds = [...new Set(applications.map(({ app }) => app.userId))];

    const [
      users,
      reviewData,
      assignments,
      gradingScores,
      statuses,
      previouslyApplied,
    ] = await Promise.all([
      loadUsers(userIds),
      appCollection(FirestoreCollection.ReviewData)
        .where("applicationFormId", "==", formId)
        .get()
        .then((s) => s.docs.map((d) => d.data())),
      queryWhereIn(
        appCollection(FirestoreCollection.ReviewAssignments),
        "applicationResponseId",
        responseIds,
      ),
      loadBestGradingScores(responseIds),
      loadStatusesByResponseRole(responseIds),
      loadPreviouslyAppliedCounts(userIds),
    ]);

    const reviewsByKey = groupBy(reviewData, (r) =>
      responseRoleKey(r.applicationResponseId, r.forRole),
    );
    const assignmentsByResponse = groupBy(
      assignments,
      (a) => a.applicationResponseId,
    );
    const reviewers = await loadUsers(assignments.map((a) => a.reviewerId));

    return applications.map(({ app, role }, index) => {
      const user = requireUser(users, app.userId);
      const reviews = reviewsByKey.get(responseRoleKey(app.id, role)) ?? [];
      const roleAssignments = (assignmentsByResponse.get(app.id) ?? []).filter(
        (a) => a.forRole === role,
      );

      const submitted = reviews.filter((r) => r.submitted);
      const individualScores = submitted.map((r) =>
        calculateReviewScore(r, form, scoreWarning),
      );
      const averageScore =
        submitted.length === 0
          ? 0
          : individualScores.reduce((acc, v) => acc + v, 0) / submitted.length;

      return {
        index: 1 + index,
        dateSubmitted: app.dateSubmitted,
        applicant: {
          id: user.id,
          name: `${user.firstName} ${user.lastName}`,
          email: user.email,
          previouslyAppliedCount: previouslyApplied.get(app.userId) ?? 0,
          internal: isInternalApplicant(user),
        },
        responseId: app.id,
        role,
        reviews: {
          assigned: roleAssignments.length,
          completed: submitted.length,
          assignments: roleAssignments,
          averageScore,
          individualScores,
          reviewData: reviews,
        },
        reviewers: {
          assigned: roleAssignments
            .map((a) => reviewers.get(a.reviewerId))
            .filter((r): r is ReviewCapableProfile => r !== undefined),
        },
        bestGradingScore: gradingScores.get(app.id) ?? null,
        status: statuses.get(responseRoleKey(app.id, role)),
      };
    });
  });
