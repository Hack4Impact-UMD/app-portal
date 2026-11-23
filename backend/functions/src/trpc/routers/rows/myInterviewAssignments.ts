import { calculateInterviewScore } from "@app-portal/shared/utils";
import { z } from "zod";

import { listInterviewAssignmentsForInterviewer } from "../../../services/interviewAssignments";
import { listInterviewDataForInterviewer } from "../../../services/interviewData";
import { getUsers } from "../../../services/users";
import { requireForm } from "../../required";
import {
  scoreWarning,
  requireUser,
  firstByApplicantRole,
  userSummary,
} from "./helpers";
import { responseRoleKey } from "./loaders";
import { reviewCapableProcedure } from "./procedures";

export const myInterviewAssignments = reviewCapableProcedure
  .input(z.object({ formId: z.string() }))
  .query(async ({ input: { formId }, ctx }) => {
    const interviewerId = ctx.token.uid;
    const [form, assignments, myInterviews] = await Promise.all([
      requireForm(formId),
      listInterviewAssignmentsForInterviewer(formId, interviewerId),
      listInterviewDataForInterviewer(formId, interviewerId),
    ]);

    const applicants = await getUsers(assignments.map((a) => a.applicantId));
    const interviewByKey = firstByApplicantRole(myInterviews);

    const rows = assignments.map((assignment, index) => {
      const applicant = requireUser(applicants, assignment.applicantId);
      const interview = interviewByKey.get(
        `${assignment.applicantId}:${assignment.forRole}`,
      );

      return {
        index: 1 + index,
        applicant: userSummary(applicant),
        applicantName: `${applicant.firstName} ${applicant.lastName}`,
        role: assignment.forRole,
        responseId: assignment.applicationResponseId,
        interviewReviewData: interview,
        score: interview
          ? {
              value: calculateInterviewScore(interview, form, scoreWarning),
              outOf: 4,
            }
          : undefined,
      };
    });

    const submittedKeys = new Set(
      myInterviews
        .filter((i) => i.submitted)
        .map((i) => responseRoleKey(i.applicationResponseId, i.forRole)),
    );

    return {
      numInterviewed: assignments.filter((a) =>
        submittedKeys.has(responseRoleKey(a.applicationResponseId, a.forRole)),
      ).length,
      rows,
    };
  });
