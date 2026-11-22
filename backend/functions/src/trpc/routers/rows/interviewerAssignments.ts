import {
  FirestoreCollection,
  PermissionRole,
} from "@app-portal/shared/constants";
import { calculateInterviewScore } from "@app-portal/shared/utils";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { appCollection } from "../../../utils/firestore";
import {
  REVIEW_CAPABLE_ROLES,
  scoreWarning,
  requireUser,
  firstByApplicantRole,
} from "./helpers";
import { loadForm, loadUsers } from "./loaders";
import { superReviewerProcedure } from "./procedures";
import type { ApplicantProfile, ReviewCapableProfile } from "./types";

export const interviewerAssignments = superReviewerProcedure
  .input(z.object({ formId: z.string(), interviewerId: z.string() }))
  .query(async ({ input: { formId, interviewerId } }) => {
    const [form, interviewer, assignments, interviewerData] = await Promise.all(
      [
        loadForm(formId),
        loadUsers([interviewerId]).then((m) => m.get(interviewerId)),
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
      ],
    );

    if (!interviewer || !REVIEW_CAPABLE_ROLES.includes(interviewer.role)) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "User is not review capable",
      });
    }

    const applicants = await loadUsers(assignments.map((a) => a.applicantId));
    const interviewByKey = firstByApplicantRole(interviewerData);

    const rows = assignments.map((assignment, index) => {
      const applicant = requireUser(applicants, assignment.applicantId);
      if (applicant.role !== PermissionRole.Applicant) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `User ${applicant.id} is not an applicant`,
        });
      }
      const interview = interviewByKey.get(
        `${assignment.applicantId}:${assignment.forRole}`,
      );

      return {
        applicant: applicant as ApplicantProfile,
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
      interviewer: interviewer as ReviewCapableProfile,
      numInterviewed: interviewerData.filter((i) => i.submitted).length,
      rows,
    };
  });
