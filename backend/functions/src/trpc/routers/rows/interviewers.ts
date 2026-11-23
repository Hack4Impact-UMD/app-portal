import { z } from "zod";

import { listInterviewAssignmentsForForm } from "../../../services/interviewAssignments";
import { listInterviewDataForForm } from "../../../services/interviewData";
import { listReviewCapableUsers } from "../../../services/users";
import { groupBy } from "../../../utils/batch";
import { superReviewerProcedure } from "./procedures";

export const interviewers = superReviewerProcedure
  .input(z.object({ formId: z.string() }))
  .query(async ({ input: { formId } }) => {
    // all reviewers are eligible for interviews, but some will never be
    // assigned interviews
    const [interviewers, interviewData, assignments] = await Promise.all([
      listReviewCapableUsers(),
      listInterviewDataForForm(formId),
      listInterviewAssignmentsForForm(formId),
    ]);

    const assignmentsByInterviewer = groupBy(
      assignments,
      (a) => a.interviewerId,
    );
    const dataByInterviewer = groupBy(interviewData, (d) => d.interviewerId);

    return interviewers.map((interviewer, index) => {
      const total = assignmentsByInterviewer.get(interviewer.id)?.length ?? 0;
      const data = dataByInterviewer.get(interviewer.id) ?? [];
      const submitted = data.filter((d) => d.submitted).length;

      return {
        index: index + 1,
        interviewer: {
          id: interviewer.id,
          name: `${interviewer.firstName} ${interviewer.lastName}`,
        },
        assignments: total,
        pendingAssignments: total - submitted,
        interviewDataCount: data.length,
      };
    });
  });
