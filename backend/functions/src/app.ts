import { createExpressMiddleware } from "@trpc/server/adapters/express";
import cors from "cors";
import express from "express";
import { logger } from "firebase-functions";

import { createContext } from "./trpc/context";
import { appRouter } from "./trpc/routers";

const app = express();

const ALLOWED_ORIGINS = [
  "https://h4i-applications.web.app",
  "https://apply.umd.hack4impact.org",
  "https://h4i-applications--pr54-reviewer-side-testin-9exyqrca.web.app",
  "http://localhost:5173",
];

app.use(
  cors({
    origin: ALLOWED_ORIGINS,
  }),
);

// Firebase Functions v2 (Cloud Run) reads the request stream to completion
// before invoking this app, populating `req.rawBody` and `req.body`. Running
// bodyParser again would re-read the already-consumed stream and throw
// "stream is not readable". Only parse when Firebase hasn't already (e.g. local
// standalone Express, where `rawBody` is undefined).
app.use((req, res, next) => {
  if ((req as express.Request & { rawBody?: Buffer }).rawBody === undefined) {
    express.json()(req, res, next);
  } else {
    next();
  }
});

app.use(
  "/trpc",
  createExpressMiddleware({
    router: appRouter,
    createContext,
    onError({ path, error }) {
      if (error.code === "INTERNAL_SERVER_ERROR") {
        logger.error(`tRPC ${path} failed:`, error);
      } else {
        logger.warn(`tRPC ${path}: ${error.code} ${error.message}`);
      }
    },
  }),
);

app.get("/", (_, res) => {
  res.status(200).json({
    status: "OK",
  });
});

export default app;
