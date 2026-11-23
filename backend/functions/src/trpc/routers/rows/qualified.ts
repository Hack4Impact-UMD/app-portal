import { PermissionRole } from "@app-portal/shared/constants";
import {
  calculateInterviewScore,
  calculateReviewScore,
  isInternalApplicant,
} from "@app-portal/shared/utils";
import { z } from "zod";

import { isReviewCapable } from "../../../models/user";
import { listInterviewAssignmentsForResponses } from "../../../services/interviewAssignments";
import { listInterviewDataForForm } from "../../../services/interviewData";
import { listReviewDataForForm } from "../../../services/reviewData";
import { listQualifiedStatusesForForm } from "../../../services/statuses";
import { getUsers } from "../../../services/users";
import { groupBy } from "../../../utils/batch";
import { roleProcedure } from "../../init";
import { requireForm } from "../../required";
import { scoreWarning, requireUser } from "./helpers";
import {
  loadExpandedSubmittedResponses,
  responseRoleKey,
  loadStatusesByResponseRole,
  loadBestGradingScores,
} from "./loaders";

export const qualified = roleProcedure([
  PermissionRole.SuperReviewer,
  PermissionRole.Board,
])
  .input(z.object({ formId: z.string() }))
  .query(async ({ input: { formId }, ctx }) => {
    const boardRoles =
      ctx.user.role === PermissionRole.Board
        ? (ctx.user.applicantRoles ?? [])
        : undefined;

    const [form, expanded, qualifiedStatuses] = await Promise.all([
      requireForm(formId),
      loadExpandedSubmittedResponses(formId),
      listQualifiedStatusesForForm(formId),
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
      getUsers(applications.map(({ app }) => app.userId)),
      listInterviewAssignmentsForResponses(responseIds),
      listInterviewDataForForm(formId),
      listReviewDataForForm(formId),
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
    const interviewers = await getUsers(
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
        .filter((u) => u !== undefined && isReviewCapable(u));

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
        internal: isInternalApplicant(user),
      };
    });
  });
