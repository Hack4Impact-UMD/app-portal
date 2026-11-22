import type { PermissionRole } from "@app-portal/shared/constants";
import { initTRPC, TRPCError } from "@trpc/server";
import * as admin from "firebase-admin";
import type { DecodedIdToken } from "firebase-admin/auth";
import { logger } from "firebase-functions";
import { ZodError } from "zod";

import type { UserProfile } from "../models/user";
import { getUserById } from "../utils/users";
import type { Context } from "./context";
import { RateLimitError, SubmitValidationError } from "./errors";
import { transformer } from "./transformer";

const isDev = process.env.FUNCTIONS_EMULATOR === "true";

const t = initTRPC.context<Context>().create({
  transformer,
  isDev,
  errorFormatter({ shape, error }) {
    const cause = error.cause;
    const hideMessage = error.code === "INTERNAL_SERVER_ERROR" && !isDev;

    return {
      ...shape,
      message: hideMessage ? "Internal server error" : shape.message,
      data: {
        ...shape.data,
        zodIssues:
          cause instanceof ZodError
            ? cause.issues.map((issue) => ({
                field: issue.path.join("."),
                message: issue.message,
              }))
            : undefined,
        validationErrors:
          cause instanceof SubmitValidationError
            ? cause.validationErrors
            : undefined,
        retryAfter:
          cause instanceof RateLimitError
            ? {
                retryAtMs: cause.retryAtMs,
                retryInMinutes: cause.retryInMinutes,
              }
            : undefined,
      },
    };
  },
});

export const router = t.router;

export const publicProcedure = t.procedure.use(async ({ ctx, next }) => {
  if (!ctx.appCheckToken) {
    logger.error("No app check token found in request.");
    throw new TRPCError({ code: "FORBIDDEN" });
  }

  try {
    await admin.appCheck().verifyToken(ctx.appCheckToken);
  } catch (err) {
    logger.error("App check verification failed!", err);
    throw new TRPCError({ code: "FORBIDDEN" });
  }

  return next();
});

export const authedProcedure = publicProcedure.use(async ({ ctx, next }) => {
  if (!ctx.idToken) {
    logger.error("No Firebase ID token was passed as a Bearer token.");
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }

  let token: DecodedIdToken;
  try {
    token = await admin.auth().verifyIdToken(ctx.idToken);
  } catch (error) {
    logger.error("Error while verifying Firebase ID token:", error);
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }

  if (!token.email_verified) {
    logger.warn(`Email ${token.email} not verified! Rejecting request!`);
    throw new TRPCError({ code: "FORBIDDEN", message: "Email not verified!" });
  }

  let userPromise: Promise<UserProfile | undefined> | undefined;
  const getUser = () => (userPromise ??= getUserById(token.uid));

  return next({ ctx: { token, getUser } });
});

export function roleProcedure(roles: PermissionRole[]) {
  return authedProcedure.use(async ({ ctx, next }) => {
    const user = await ctx.getUser();

    if (!user) {
      logger.error(`roleProcedure: User with id ${ctx.token.uid} not found!`);
      throw new TRPCError({ code: "FORBIDDEN" });
    }

    if (!roles.includes(user.role)) {
      logger.warn(
        `roleProcedure: User has role ${user.role}, but needed roles ${roles}!`,
      );
      throw new TRPCError({ code: "FORBIDDEN" });
    }

    return next({ ctx: { user } });
  });
}
