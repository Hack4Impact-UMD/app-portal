import type { ValidationError } from "@app-portal/shared/types";
import { TRPCError } from "@trpc/server";
import { logger } from "firebase-functions";

export class SubmitValidationError extends Error {
  constructor(public readonly validationErrors: ValidationError[]) {
    super("Application response failed validation");
  }
}

export class RateLimitError extends Error {
  constructor(
    message: string,
    public readonly retryAtMs: number,
    public readonly retryInMinutes: number,
  ) {
    super(message);
  }
}

export function orNotFound<T>(value: T | undefined, message?: string): T {
  if (value === undefined) throw new TRPCError({ code: "NOT_FOUND", message });
  return value;
}

export function forbidden(logMessage?: string, message?: string) {
  if (logMessage) logger.warn(logMessage);
  return new TRPCError({ code: "FORBIDDEN", message });
}
