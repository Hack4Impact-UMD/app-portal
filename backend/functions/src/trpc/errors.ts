import type { ValidationError } from "@app-portal/shared/types";

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
