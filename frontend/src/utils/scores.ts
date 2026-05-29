import type {
  ApplicationReviewData,
  ApplicationInterviewData,
} from "@app-portal/shared/types";

import { throwWarningToast } from "@/components/toasts/WarningToast";
import type { ApplicationForm } from "@/types/types";

export function calculateReviewScore(
  review: ApplicationReviewData,
  form: ApplicationForm,
): number {
  const scores = Object.keys(review.applicantScores);
  if (scores.length === 0) return 0;

  if (!form.scoreWeights) {
    throwWarningToast(
      "Form does not have review weights, falling back to average scoring!",
    );
    return roundScore(averageScore(review.applicantScores), 2);
  }

  const weightsForRole = form.scoreWeights?.[review.forRole];
  if (!weightsForRole) {
    throwWarningToast(
      "Form does not have review weights for this role, falling back to average scoring!",
    );
    return roundScore(averageScore(review.applicantScores), 2);
  }

  return calculateScore(weightsForRole, review.applicantScores);
}

export function calculateInterviewScore(
  interview: ApplicationInterviewData,
  form: ApplicationForm,
): number {
  const scores = Object.keys(interview.interviewScores);
  if (scores.length === 0) return 0;

  if (!form.interviewScoreWeights) {
    throwWarningToast(
      "Form does not have interview weights, falling back to average scoring!",
    );
    return roundScore(averageScore(interview.interviewScores), 2);
  }

  const weightsForRole = form.interviewScoreWeights?.[interview.forRole];
  if (!weightsForRole) {
    throwWarningToast(
      "Form does not have interview weights for this role, falling back to average scoring!",
    );
    return roundScore(averageScore(interview.interviewScores), 2);
  }

  return calculateScore(weightsForRole, interview.interviewScores);
}

export function calculateScore(
  weights: Record<string, number>,
  scores: Record<string, number>,
): number {
  if (hasScoreKeyMismatch(weights, scores)) {
    throwWarningToast(
      `Form and scores don't have matching keys, falling back to average scoring! If you're seeing this, there is something wrong with the rubric and form configuration.`,
    );
    return roundScore(averageScore(scores), 2);
  }

  //NOTE: this causes an annoying amount of warnings while the review is in progress, the first check is sufficient
  // if (missingRequiredScoreKeys(weights, scores)) {
  //   throwWarningToast("Score is missing required keys, returning -1 score!");
  //   return -1;
  // }

  const score = Object.keys(weights).reduce((acc, scoreCategory) => {
    const weight = weights[scoreCategory] ?? 0;
    const score = scores[scoreCategory] ?? 0;
    return acc + weight * score;
  }, 0);
  return roundScore(score, 2);
}

function averageScore(scores: Record<string, number>) {
  if (Object.values(scores).length === 0) return 0;
  const scoreValues = Object.values(scores);
  return scoreValues.reduce((acc, s) => acc + s, 0) / scoreValues.length;
}

function hasScoreKeyMismatch(
  weights: Record<string, number>,
  scores: Record<string, number>,
): boolean {
  const formWeightKeys = Object.keys(weights);
  const scoreKeys = Object.keys(scores ?? {});

  const keysMatch =
    formWeightKeys.length === scoreKeys.length &&
    formWeightKeys.every((k) => k in scores) &&
    scoreKeys.every((k) => k in weights);

  console.log("weights" + formWeightKeys);
  console.log("scores" + scoreKeys);

  return !keysMatch && scoreKeys.length >= formWeightKeys.length;
}

// function missingRequiredScoreKeys(
//   weights: Record<string, number>,
//   scores: Record<string, number>,
// ): boolean {
//   return !Object.keys(weights).every((weight) => weight in scores);
// }

function roundScore(score: number, decimalPlaces: number) {
  const factor = Math.pow(10, decimalPlaces);
  return Math.round((score + Number.EPSILON) * factor) / factor;
}
