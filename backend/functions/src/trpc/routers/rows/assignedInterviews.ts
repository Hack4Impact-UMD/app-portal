import { FirestoreCollection } from "@app-portal/shared/constants";
import type { ApplicationInterviewData } from "@app-portal/shared/types";
import { calculateInterviewScore } from "@app-portal/shared/utils";
import { z } from "zod";

import { appCollection } from "../../../utils/firestore";
import {
  scoreWarning,
  isReviewCapable,
  assignedUserName,
  requireUser,
} from "./helpers";
import { loadForm, loadUsers, loadResponse } from "./loaders";
import { superReviewerProcedure } from "./procedures";
import type { ApplicantProfile } from "./types";

export const assignedInterviews = superReviewerProcedure
  .input(z.object({ responseId: z.string() }))
  .query(async ({ input: { responseId } }) => {
    const [response, assignments, interviewData] = await Promise.all([
      loadResponse(responseId),
      appCollection(FirestoreCollection.InterviewAssignments)
        .where("applicationResponseId", "==", responseId)
        .get()
        .then((s) => s.docs.map((d) => d.data())),
      appCollection(FirestoreCollection.InterviewData)
        .where("applicationResponseId", "==", responseId)
        .get()
        .then((s) => s.docs.map((d) => d.data())),
    ]);

    const [form, users] = await Promise.all([
      loadForm(response.applicationFormId),
      loadUsers([response.userId, ...assignments.map((a) => a.interviewerId)]),
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
      applicant: requireUser(users, response.userId) as ApplicantProfile,
      response,
      numInterviewed: interviewData.filter((i) => i.submitted).length,
      rows,
    };
  });
