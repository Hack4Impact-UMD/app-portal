import { FirestoreCollection } from "@app-portal/shared/constants";
import { calculateInterviewScore } from "@app-portal/shared/utils";
import { z } from "zod";

import { appCollection } from "../../../utils/firestore";
import {
  scoreWarning,
  requireUser,
  firstByApplicantRole,
  userSummary,
} from "./helpers";
import { loadForm, responseRoleKey, loadUsers } from "./loaders";
import { reviewCapableProcedure } from "./procedures";

export const myInterviewAssignments = reviewCapableProcedure
  .input(z.object({ formId: z.string() }))
  .query(async ({ input: { formId }, ctx }) => {
    const interviewerId = ctx.token.uid;
    const [form, assignments, myInterviews] = await Promise.all([
      loadForm(formId),
      appCollection(FirestoreCollection.InterviewAssignments)
        .where("formId", "==", formId)
        .where("interviewerId", "==", interviewerId)
        .where("assignmentType", "==", "interview")
        .get()
        .then((s) => s.docs.map((d) => d.data())),
      appCollection(FirestoreCollection.InterviewData)
        .where("interviewerId", "==", interviewerId)
        .where("applicationFormId", "==", formId)
        .get()
        .then((s) => s.docs.map((d) => d.data())),
    ]);

    const applicants = await loadUsers(assignments.map((a) => a.applicantId));
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
