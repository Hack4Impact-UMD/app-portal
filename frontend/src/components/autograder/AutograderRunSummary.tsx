import type { GradingJobStatus } from "@app-portal/shared/constants";
import type { Timestamp } from "firebase/firestore";

import AutograderRunStatusSummary from "@/components/autograder/AutograderRunStatusSummary";
import AutograderSubmissionSummary from "@/components/autograder/AutograderSubmissionSummary";

type AutograderRunSummaryProps = {
  status: GradingJobStatus;
  score: number;
  repoURL: string;
  jobId: string;
  responseId: string;
  started: Timestamp;
  updated: Timestamp;
};

export default function AutograderRunSummary({
  status,
  score,
  repoURL,
  jobId,
  responseId,
  started,
  updated,
}: AutograderRunSummaryProps) {
  return (
    <aside className="sticky top-20 flex self-start flex-col gap-3">
      <AutograderRunStatusSummary
        status={status}
        score={score}
        started={started}
        updated={updated}
      />
      <AutograderSubmissionSummary
        repoURL={repoURL}
        jobId={jobId}
        responseId={responseId}
      />
    </aside>
  );
}
