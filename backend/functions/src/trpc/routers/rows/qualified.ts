import {
  FirestoreCollection,
  PermissionRole,
} from "@app-portal/shared/constants";
import {
  calculateInterviewScore,
  calculateReviewScore,
} from "@app-portal/shared/utils";
import { z } from "zod";

import { groupBy, queryWhereIn } from "../../../utils/batch";
import { appCollection } from "../../../utils/firestore";
import { roleProcedure } from "../../init";
import { REVIEW_CAPABLE_ROLES, scoreWarning, requireUser } from "./helpers";
import {
  loadForm,
  loadExpandedSubmittedResponses,
  responseRoleKey,
  loadStatusesByResponseRole,
  loadBestGradingScores,
  loadUsers,
} from "./loaders";
import type { AnyUserProfile, ReviewCapableProfile } from "./types";

export const qualified = roleProcedure([
  PermissionRole.SuperReviewer,
  PermissionRole.Board,
])
  .input(z.object({ formId: z.string() }))
  .query(async ({ input: { formId }, ctx }) => {
    const boardRoles =
      ctx.user.role === PermissionRole.Board
        ? ((ctx.user as AnyUserProfile).applicantRoles ?? [])
        : undefined;

    const [form, expanded, qualifiedStatuses] = await Promise.all([
      loadForm(formId),
      loadExpandedSubmittedResponses(formId),
      appCollection(FirestoreCollection.ApplicationStatus)
        .where("formId", "==", formId)
        .where("isQualified", "==", true)
        .get()
        .then((s) => s.docs.map((d) => d.data())),
    ]);

    const qualifiedSet = new Set(
      qualifiedStatuses
        .filter((s) => !boardRoles || boardRoles.includes(s.role))
        .map((s) => responseRoleKey(s.responseId, s.role)),
    );
    const applications = expanded.filter(({ app, role }) =>
      qualifiedSet.has(responseRoleKey(app.id, role)),
    );

    const responseIds = [...new Set(applications.map(({ app }) => app.id))];

    const [
      users,
      interviewAssignments,
      interviewData,
      reviewData,
      gradingScores,
      statuses,
    ] = await Promise.all([
      loadUsers(applications.map(({ app }) => app.userId)),
      queryWhereIn(
        appCollection(FirestoreCollection.InterviewAssignments),
        "applicationResponseId",
        responseIds,
      ),
      appCollection(FirestoreCollection.InterviewData)
        .where("applicationFormId", "==", formId)
        .get()
        .then((s) => s.docs.map((d) => d.data())),
      appCollection(FirestoreCollection.ReviewData)
        .where("applicationFormId", "==", formId)
        .get()
        .then((s) => s.docs.map((d) => d.data())),
      loadBestGradingScores(responseIds),
      loadStatusesByResponseRole(responseIds),
    ]);

    const assignmentsByResponse = groupBy(
      interviewAssignments,
      (a) => a.applicationResponseId,
    );
    const interviewsByKey = groupBy(interviewData, (i) =>
      responseRoleKey(i.applicationResponseId, i.forRole),
    );
    const reviewsByKey = groupBy(reviewData, (r) =>
      responseRoleKey(r.applicationResponseId, r.forRole),
    );
    const interviewers = await loadUsers(
      interviewAssignments.map((a) => a.interviewerId),
    );

    return applications.map(({ app, role }, index) => {
      const user = requireUser(users, app.userId);
      const key = responseRoleKey(app.id, role);
      const assignments = (assignmentsByResponse.get(app.id) ?? []).filter(
        (a) => a.forRole === role,
      );
      const assignedInterviewers = assignments
        .map((a) => interviewers.get(a.interviewerId))
        .filter(
          (u): u is AnyUserProfile =>
            u !== undefined && REVIEW_CAPABLE_ROLES.includes(u.role),
        ) as ReviewCapableProfile[];

      const interviews = interviewsByKey.get(key) ?? [];
      const individualScores = interviews
        .filter((i) => i.submitted)
        .map((i) => calculateInterviewScore(i, form, scoreWarning));
      const averageScore =
        individualScores.length > 0
          ? individualScores.reduce((acc, v) => acc + v, 0) /
            individualScores.length
          : null;

      const submittedReviews = (reviewsByKey.get(key) ?? []).filter(
        (r) => r.submitted,
      );
      const averageReviewScore =
        submittedReviews.length > 0
          ? submittedReviews.reduce(
              (acc, r) => acc + calculateReviewScore(r, form, scoreWarning),
              0,
            ) / submittedReviews.length
          : null;

      return {
        index: 1 + index,
        dateSubmitted: app.dateSubmitted,
        name: `${user.firstName} ${user.lastName}`,
        email: user.email,
        role,
        interviewers: { assigned: assignedInterviewers },
        assignments,
        averageScore,
        individualScores,
        averageReviewScore,
        bestGradingScore: gradingScores.get(app.id) ?? null,
        responseId: app.id,
        interviews,
        status: statuses.get(key),
        internal: user.isInternal ?? false,
      };
    });
  });
