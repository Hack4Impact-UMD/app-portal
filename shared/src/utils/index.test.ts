import { describe, expect, it, vi } from "vitest";

import { ApplicantRole, ApplicationStatus } from "../constants/index.js";
import {
  bestGradingScore,
  calculateInterviewScore,
  calculateReviewScore,
  countPreviouslyApplied,
  getGradingJobMaxScore,
  pickBestGradingJob,
} from "./index.js";

type Weights = Partial<Record<ApplicantRole, Record<string, number>>>;
type FullWeights = Record<ApplicantRole, Record<string, number>>;
const reviewForm = (w: Weights) => ({ scoreWeights: w as FullWeights });
const interviewForm = (w: Weights) => ({
  interviewScoreWeights: w as FullWeights,
});

const review = (applicantScores: Record<string, number>) => ({
  applicantScores,
  forRole: ApplicantRole.Engineer,
});

describe("calculateReviewScore", () => {
  it("weights each score category by the form's weights for the role", () => {
    const form = reviewForm({
      [ApplicantRole.Engineer]: { technical: 0.75, culture: 0.25 },
    });
    expect(
      calculateReviewScore(review({ technical: 4, culture: 2 }), form),
    ).toBe(3.5);
  });

  it("returns 0 when nothing has been scored", () => {
    expect(calculateReviewScore(review({}), reviewForm({}))).toBe(0);
  });

  it("falls back to the average and warns when the role has no weights", () => {
    const onWarning = vi.fn();
    const score = calculateReviewScore(
      review({ a: 3, b: 4 }),
      reviewForm({}),
      onWarning,
    );
    expect(score).toBe(3.5);
    expect(onWarning).toHaveBeenCalledOnce();
  });

  it("falls back to the average when score keys don't match the weights", () => {
    const onWarning = vi.fn();
    const form = reviewForm({ [ApplicantRole.Engineer]: { technical: 1 } });
    expect(
      calculateReviewScore(review({ other: 2, more: 3 }), form, onWarning),
    ).toBe(2.5);
    expect(onWarning).toHaveBeenCalledOnce();
  });

  it("rounds to two decimal places", () => {
    const form = reviewForm({
      [ApplicantRole.Engineer]: { a: 1 / 3, b: 2 / 3 },
    });
    expect(calculateReviewScore(review({ a: 1, b: 2 }), form)).toBe(1.67);
  });
});

describe("calculateInterviewScore", () => {
  it("uses the interview weights", () => {
    const form = interviewForm({
      [ApplicantRole.Engineer]: { communication: 0.5, problemSolving: 0.5 },
    });
    expect(
      calculateInterviewScore(
        {
          interviewScores: { communication: 2, problemSolving: 4 },
          forRole: ApplicantRole.Engineer,
        },
        form,
      ),
    ).toBe(3);
  });
});

const job = (score: number, totals: number[]) => ({
  score,
  suiteResults: Object.fromEntries(
    totals.map((totalPoints, i) => [`suite${i}`, { totalPoints }]),
  ),
});

describe("grading job scores", () => {
  it("sums suite totals for the max score", () => {
    expect(getGradingJobMaxScore(job(0, [10, 5]))).toBe(15);
  });

  it("picks the job with the highest score ratio", () => {
    const best = job(9, [10]);
    expect(pickBestGradingJob([job(4, [10]), best, job(1, [2])])).toBe(best);
  });

  it("falls back to the first (newest) job when none have a max score", () => {
    const newest = job(0, []);
    expect(pickBestGradingJob([newest, job(0, [])])).toBe(newest);
  });

  it("reports the best ratio, or null when there's nothing gradable", () => {
    expect(bestGradingScore([job(3, [4]), job(1, [4])])).toBe(0.75);
    expect(bestGradingScore([job(0, [])])).toBeNull();
    expect(bestGradingScore([])).toBeNull();
  });
});

describe("countPreviouslyApplied", () => {
  const active: Record<string, boolean> = {
    old1: false,
    old2: false,
    now: true,
  };
  const isActive = (formId: string) => active[formId];

  it("counts distinct inactive forms with a submitted response", () => {
    expect(
      countPreviouslyApplied(
        [
          { applicationFormId: "old1", status: ApplicationStatus.Submitted },
          { applicationFormId: "old1", status: ApplicationStatus.Submitted },
          { applicationFormId: "old2", status: ApplicationStatus.Submitted },
          { applicationFormId: "now", status: ApplicationStatus.Submitted },
        ],
        isActive,
      ),
    ).toBe(2);
  });

  it("ignores in-progress responses and forms that no longer exist", () => {
    expect(
      countPreviouslyApplied(
        [
          { applicationFormId: "old1", status: ApplicationStatus.InProgress },
          { applicationFormId: "deleted", status: ApplicationStatus.Submitted },
        ],
        isActive,
      ),
    ).toBe(0);
  });
});
