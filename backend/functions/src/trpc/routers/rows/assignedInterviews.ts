import type { ApplicationInterviewData } from "@app-portal/shared/types";
import { calculateInterviewScore } from "@app-portal/shared/utils";
import { z } from "zod";

import { isReviewCapable } from "../../../models/user";
import { listInterviewAssignmentsForResponse } from "../../../services/interviewAssignments";
import { listInterviewDataForResponse } from "../../../services/interviewData";
import { getUsers } from "../../../services/users";
import { requireForm, requireResponse } from "../../required";
import {
  scoreWarning,
  assignedUserName,
  requireUser,
  userSummary,
} from "./helpers";
import { boardProcedure } from "./procedures";

export const assignedInterviews = boardProcedure
  .input(z.object({ responseId: z.string() }))
  .query(async ({ input: { responseId } }) => {
    const [response, assignments, interviewData] = await Promise.all([
      requireResponse(responseId),
      listInterviewAssignmentsForResponse(responseId),
      listInterviewDataForResponse(responseId),
    ]);

    const [form, users] = await Promise.all([
      requireForm(response.applicationFormId),
      getUsers([response.userId, ...assignments.map((a) => a.interviewerId)]),
    ]);

    const interviewByKey = new Map<string, ApplicationInterviewData>();
    for (const interview of interviewData) {
      const key = `${interview.applicantId}:${interview.forRole}:${interview.applicationFormId}:${interview.interviewerId}`;
      if (!interviewByKey.has(key)) interviewByKey.set(key, interview);
    }

    const rows = assignments.map((assignment, index) => {
      const interviewer = users.get(assignment.interviewerId);
      const interview = interviewByKey.get(
        `${assignment.applicantId}:${assignment.forRole}:${assignment.formId}:${assignment.interviewerId}`,
      );

      return {
        interviewer:
          interviewer && isReviewCapable(interviewer) ? interviewer : undefined,
        applicantId: assignment.applicantId,
        interviewerName: assignedUserName(interviewer, "interviewer"),
        index: 1 + index,
        formId: assignment.formId,
        responseId: assignment.applicationResponseId,
        role: assignment.forRole,
        interview,
        score:
          interview && interview.submitted
            ? {
                value: calculateInterviewScore(interview, form, scoreWarning),
                outOf: 4, // NOTE: All scores are assumed to be out of 4
              }
            : undefined,
      };
    });

    return {
      applicant: userSummary(requireUser(users, response.userId)),
      response,
      numInterviewed: interviewData.filter((i) => i.submitted).length,
      rows,
    };
  });
