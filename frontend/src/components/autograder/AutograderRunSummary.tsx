import { GradingJobStatus } from "@app-portal/shared/constants";
import type { Timestamp } from "firebase/firestore";
import {
  CheckCircle2,
  ExternalLink,
  LoaderCircle,
  XCircle,
} from "lucide-react";

import { Progress } from "@/components/ui/progress";
import { useApplicantForResponse } from "@/hooks/useApplicants";
import { displayTimestamp } from "@/utils/dates";
import { displayDurationMs, displayGradingJobStatus } from "@/utils/display";
import { isTerminalGradingJobStatus } from "@/utils/grading";

type AutograderRunSummaryProps = {
  status: GradingJobStatus;
  score: number;
  maxScore: number;
  repoURL: string;
  jobId: string;
  responseId: string;
  started: Timestamp;
  updated: Timestamp;
  durationMs?: number;
};

function RunStatus({ status }: { status: GradingJobStatus }) {
  const completed = status === GradingJobStatus.Completed;
  const failed = status === GradingJobStatus.Failed;
  const Icon = completed ? CheckCircle2 : failed ? XCircle : LoaderCircle;
  const iconClass = completed
    ? "text-green-700"
    : failed
      ? "text-destructive"
      : "text-blue";

  return (
    <div>
      <dt className="text-muted-foreground">Run status</dt>
      <dd className="mt-1">
        <div className="flex items-center gap-2 font-medium text-foreground">
          {isTerminalGradingJobStatus(status)
            ? displayGradingJobStatus(status)
            : "Autograder running"}
          <Icon
            className={`size-4 shrink-0 ${iconClass} ${isTerminalGradingJobStatus(status) ? "" : "animate-spin"}`}
          />
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          {completed
            ? "The run finished successfully."
            : failed
              ? "The run ended before producing a successful result."
              : "This page will update automatically as each step finishes."}
        </p>
      </dd>
    </div>
  );
}

export default function AutograderRunSummary({
  status,
  score,
  repoURL,
  jobId,
  responseId,
  started,
  updated,
  maxScore,
  durationMs
}: AutograderRunSummaryProps) {
  const finished = isTerminalGradingJobStatus(status);
  const {
    data: applicant,
    isPending: isApplicantPending,
    error: applicantError,
  } = useApplicantForResponse(responseId);

  const applicantName = applicant
    ? `${applicant.firstName} ${applicant.lastName}`
    : isApplicantPending
      ? "Loading..."
      : applicantError
        ? "Unable to load applicant"
        : "Unknown applicant";

  return (
    <aside className="sticky top-20 flex self-start flex-col gap-3">
      <section className="rounded-md border bg-background p-3 shadow-xs">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-foreground">Summary</h2>
        </div>

        <div className="mt-3 space-y-3">
          <dl className="text-sm">
            <RunStatus status={status} />
          </dl>

          <div>
            <div className="mb-2 flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Overall score</span>
              <span className="font-medium">
                {finished ? score : "Pending"} / {maxScore}
              </span>
            </div>
            <Progress
              value={finished ? (score / maxScore) * 100 : 0}
              indeterminate={!finished}
            />
          </div>

          <dl className="space-y-2.5 text-sm">
            <div>
              <dt className="text-muted-foreground">Started</dt>
              <dd className="mt-1 font-medium text-foreground">
                {displayTimestamp(started)}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Last updated</dt>
              <dd className="mt-1 font-medium text-foreground">
                {displayTimestamp(updated)}
              </dd>
            </div>
            {durationMs && (
              <div>
                <dt className="text-muted-foreground">Job Duration</dt>
                <dd className="mt-1 font-medium text-foreground">
                  {displayDurationMs(durationMs)}
                </dd>
              </div>
            )}
          </dl>
        </div>
      </section>

      <section className="rounded-md border bg-background p-3 shadow-xs">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-foreground">Submission</h2>
        </div>
        <dl className="mt-3 space-y-2.5 text-sm">
          <div>
            <dt className="text-muted-foreground">Applicant</dt>
            <dd className="mt-1 font-medium text-foreground">
              {applicantName}
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Repository</dt>
            <dd className="mt-1 flex min-w-0 items-center">
              <a
                href={repoURL}
                target="_blank"
                rel="noreferrer"
                className="flex min-w-0 items-center gap-1 font-medium text-blue hover:underline"
              >
                <span className="truncate">{repoURL}</span>
                <ExternalLink className="size-3 shrink-0" />
              </a>
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Job ID</dt>
            <dd className="mt-1 break-all font-mono text-xs">{jobId}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Response ID</dt>
            <dd className="mt-1 break-all font-mono text-xs">{responseId}</dd>
          </div>
        </dl>
      </section>
    </aside>
  );
}
