import type {
  ApplicationReviewData,
  ApplicationInterviewData,
} from "@app-portal/shared/types";
import {
  calculateInterviewScore as calculateInterviewScoreShared,
  calculateReviewScore as calculateReviewScoreShared,
} from "@app-portal/shared/utils";

import { throwWarningToast } from "@/components/toasts/WarningToast";
import type { ApplicationForm } from "@/types/types";

export function calculateReviewScore(
  review: ApplicationReviewData,
  form: ApplicationForm,
): number {
  return calculateReviewScoreShared(review, form, throwWarningToast);
}

export function calculateInterviewScore(
  interview: ApplicationInterviewData,
  form: ApplicationForm,
): number {
  return calculateInterviewScoreShared(interview, form, throwWarningToast);
}
