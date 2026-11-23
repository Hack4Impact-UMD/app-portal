import { calculateInterviewScore } from "@app-portal/shared/utils";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { listInterviewAssignmentsForInterviewer } from "../../../services/interviewAssignments";
import { listInterviewDataForInterviewer } from "../../../services/interviewData";
import { getUser, getUsers } from "../../../services/users";
import { requireForm } from "../../required";
import {
  scoreWarning,
  requireUser,
  firstByApplicantRole,
  reviewingFor,
  userSummary,
} from "./helpers";
import { superReviewerProcedure } from "./procedures";

export const interviewerAssignments = superReviewerProcedure
  .input(z.object({ formId: z.string(), interviewerId: z.string() }))
  .query(async ({ input: { formId, interviewerId } }) => {
    const [form, interviewer, assignments, interviewerData] = await Promise.all(
      [
        requireForm(formId),
        getUser(interviewerId),
        listInterviewAssignmentsForInterviewer(formId, interviewerId),
        listInterviewDataForInterviewer(formId, interviewerId),
      ],
    );

    if (!interviewer) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "User not found",
      });
    }

    const applicants = await getUsers(assignments.map((a) => a.applicantId));
    const interviewByKey = firstByApplicantRole(interviewerData);

    const rows = assignments.map((assignment, index) => {
      const applicant = requireUser(applicants, assignment.applicantId);
      const interview = interviewByKey.get(
        `${assignment.applicantId}:${assignment.forRole}`,
      );

      return {
        applicant: userSummary(applicant),
        applicantId: assignment.applicantId,
        applicantName: `${applicant.firstName} ${applicant.lastName}`,
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
      interviewer: {
        ...userSummary(interviewer),
        roles: reviewingFor(interviewer),
      },
      numInterviewed: interviewerData.filter((i) => i.submitted).length,
      rows,
    };
  });
