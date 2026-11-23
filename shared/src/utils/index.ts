import { ApplicationStatus, ReviewStatus } from "../constants/index.js";
import type {
  ApplicationFormBase,
  ApplicationInterviewData,
  ApplicationReviewData,
} from "../types/index.js";

export type ScoreWarningHandler = (message: string) => void;

type ReviewWeightsForm = Pick<ApplicationFormBase, "scoreWeights">;
type InterviewWeightsForm = Pick<ApplicationFormBase, "interviewScoreWeights">;

const noop: ScoreWarningHandler = () => {};

export function calculateReviewScore(
  review: Pick<ApplicationReviewData, "applicantScores" | "forRole">,
  form: ReviewWeightsForm,
  onWarning: ScoreWarningHandler = noop,
): number {
  const scores = Object.keys(review.applicantScores);
  if (scores.length === 0) return 0;

  if (!form.scoreWeights) {
    onWarning(
      "Form does not have review weights, falling back to average scoring!",
    );
    return roundScore(averageScore(review.applicantScores), 2);
  }

  const weightsForRole = form.scoreWeights?.[review.forRole];
  if (!weightsForRole) {
    onWarning(
      "Form does not have review weights for this role, falling back to average scoring!",
    );
    return roundScore(averageScore(review.applicantScores), 2);
  }

  return calculateScore(weightsForRole, review.applicantScores, onWarning);
}

export function calculateInterviewScore(
  interview: Pick<ApplicationInterviewData, "interviewScores" | "forRole">,
  form: InterviewWeightsForm,
  onWarning: ScoreWarningHandler = noop,
): number {
  const scores = Object.keys(interview.interviewScores);
  if (scores.length === 0) return 0;

  if (!form.interviewScoreWeights) {
    onWarning(
      "Form does not have interview weights, falling back to average scoring!",
    );
    return roundScore(averageScore(interview.interviewScores), 2);
  }

  const weightsForRole = form.interviewScoreWeights?.[interview.forRole];
  if (!weightsForRole) {
    onWarning(
      "Form does not have interview weights for this role, falling back to average scoring!",
    );
    return roundScore(averageScore(interview.interviewScores), 2);
  }

  return calculateScore(weightsForRole, interview.interviewScores, onWarning);
}

function calculateScore(
  weights: Record<string, number>,
  scores: Record<string, number>,
  onWarning: ScoreWarningHandler,
): number {
  if (hasScoreKeyMismatch(weights, scores)) {
    onWarning(
      `Form and scores don't have matching keys, falling back to average scoring! If you're seeing this, there is something wrong with the rubric and form configuration.`,
    );
    return roundScore(averageScore(scores), 2);
  }

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

  return !keysMatch && scoreKeys.length >= formWeightKeys.length;
}

function roundScore(score: number, decimalPlaces: number) {
  const factor = Math.pow(10, decimalPlaces);
  return Math.round((score + Number.EPSILON) * factor) / factor;
}

type ScoredGradingJob = {
  score: number;
  suiteResults: Record<string, { totalPoints: number }>;
};

export function getGradingJobMaxScore(job: {
  suiteResults: Record<string, { totalPoints: number }>;
}) {
  return Object.values(job.suiteResults).reduce(
    (total, suite) => total + suite.totalPoints,
    0,
  );
}

export function pickBestGradingJob<J extends ScoredGradingJob>(
  jobs: J[],
): J | null {
  let best: J | null = null;
  let bestScore = -1;

  for (const job of jobs) {
    const maxScore = getGradingJobMaxScore(job);
    if (maxScore <= 0) continue;

    const score = job.score / maxScore;
    if (score > bestScore) {
      bestScore = score;
      best = job;
    }
  }

  return best ?? jobs[0] ?? null;
}

export function bestGradingScore(jobs: ScoredGradingJob[]): number | null {
  const best = pickBestGradingJob(jobs);
  if (!best) return null;

  const maxScore = getGradingJobMaxScore(best);
  if (maxScore <= 0) return null;

  return best.score / maxScore;
}

export function countPreviouslyApplied(
  responses: { applicationFormId: string; status: ApplicationStatus }[],
  isFormActive: (formId: string) => boolean | undefined,
): number {
  const inactiveFormIds = new Set<string>();

  for (const response of responses) {
    const active = isFormActive(response.applicationFormId);
    if (active === undefined) continue;
    if (!active && response.status !== ApplicationStatus.InProgress) {
      inactiveFormIds.add(response.applicationFormId);
    }
  }

  return inactiveFormIds.size;
}

export function isDecided(status: ReviewStatus) {
  return (
    status === ReviewStatus.Accepted ||
    status === ReviewStatus.Denied ||
    status === ReviewStatus.Waitlisted
  );
}
