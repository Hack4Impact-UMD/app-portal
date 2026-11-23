import { router } from "../init";
import { applicationRouter } from "./application";
import { authRouter } from "./auth";
import { formsRouter } from "./forms";
import { gradingRouter } from "./grading";
import { interviewAssignmentsRouter } from "./interviewAssignments";
import { interviewDataRouter } from "./interviewData";
import { reviewAssignmentsRouter } from "./reviewAssignments";
import { reviewDataRouter } from "./reviewData";
import { rowsRouter } from "./rows";
import { rubricsRouter } from "./rubrics";
import { statusRouter } from "./status";
import { usersRouter } from "./users";

export const appRouter = router({
  auth: authRouter,
  status: statusRouter,
  application: applicationRouter,
  grading: gradingRouter,
  rows: rowsRouter,
  users: usersRouter,
  forms: formsRouter,
  rubrics: rubricsRouter,
  reviewAssignments: reviewAssignmentsRouter,
  interviewAssignments: interviewAssignmentsRouter,
  reviewData: reviewDataRouter,
  interviewData: interviewDataRouter,
});

export type AppRouter = typeof appRouter;
