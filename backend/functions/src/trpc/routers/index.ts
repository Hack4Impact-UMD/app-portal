import { router } from "../init";
import { applicationRouter } from "./application";
import { authRouter } from "./auth";
import { gradingRouter } from "./grading";
import { rowsRouter } from "./rows";
import { statusRouter } from "./status";

export const appRouter = router({
  auth: authRouter,
  status: statusRouter,
  application: applicationRouter,
  grading: gradingRouter,
  rows: rowsRouter,
});

export type AppRouter = typeof appRouter;
