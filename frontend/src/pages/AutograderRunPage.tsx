import { GradingJobStatus } from "@app-portal/shared/constants";
import {
  CheckCircle2,
  Circle,
  CircleAlert,
  ExternalLink,
  Github,
  LoaderCircle,
  XCircle,
} from "lucide-react";
import { useParams } from "react-router-dom";

import Loading from "@/components/Loading";
import { Progress } from "@/components/ui/progress";
import { useGradingJobSnapshot } from "@/hooks/useGrading";
import { displayGradingJobStatus, gradingJobEmoji } from "@/utils/display";

type StepDisplayStatus = "complete" | "active" | "pending";
const terminalStatuses = [GradingJobStatus.Completed, GradingJobStatus.Failed];
const runnableGradingJobStatuses = Object.values(GradingJobStatus).filter(
  (status) => !terminalStatuses.includes(status),
);

function isTerminalStatus(status: GradingJobStatus) {
  return terminalStatuses.includes(status);
}

function getStepDisplayStatus(
  stepStatus: GradingJobStatus,
  currentStatus: GradingJobStatus,
): StepDisplayStatus {
  if (isTerminalStatus(currentStatus)) return "complete";

  const stepIndex = runnableGradingJobStatuses.indexOf(stepStatus);
  const currentIndex = runnableGradingJobStatuses.indexOf(currentStatus);

  if (stepIndex < currentIndex) return "complete";
  if (stepIndex === currentIndex) return "active";
  return "pending";
}

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
      <dt className="flex items-center gap-2 text-muted-foreground">
        Run status
        <Icon
          className={`size-4 shrink-0 ${iconClass} ${isTerminalStatus(status) ? "" : "animate-spin"}`}
        />
      </dt>
      <dd className="mt-1">
        <div className="font-medium text-foreground">
          {isTerminalStatus(status)
            ? displayGradingJobStatus(status)
            : "Autograder running"}
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

function StepIcon({
  stepStatus,
  displayStatus,
}: {
  stepStatus: GradingJobStatus;
  displayStatus: StepDisplayStatus;
}) {
  if (displayStatus === "complete") {
    return (
      <span
        aria-hidden
        className="flex size-7 items-center justify-center text-lg"
      >
        {gradingJobEmoji[stepStatus]}
      </span>
    );
  }

  if (displayStatus === "active") {
    return <LoaderCircle className="size-5 animate-spin text-blue" />;
  }

  return <Circle className="size-5 text-muted-foreground" />;
}

export default function AutograderRunPage() {
  const { jobId } = useParams();
  const {
    data: job,
    isPending,
    error,
    notFound,
  } = useGradingJobSnapshot(jobId);

  if (isPending) {
    return <Loading />;
  }

  if (error) {
    return (
      <main className="flex h-screen flex-col items-center justify-center bg-muted p-8 text-center">
        <CircleAlert className="mb-4 size-12 text-destructive" />
        <h1 className="text-3xl font-semibold text-foreground">
          Failed to load autograder job! ID: {jobId}
        </h1>
        <p className="mt-2 max-w-md text-muted-foreground">{error.message}</p>
      </main>
    );
  }

  if (notFound || !job) {
    return (
      <main className="flex h-screen flex-col items-center justify-center bg-muted p-8 text-center">
        <CircleAlert className="mb-4 size-12 text-destructive" />
        <h1 className="text-3xl font-semibold text-foreground">
          Autograder job not found! Id: {jobId}
        </h1>
        <p className="mt-2 text-muted-foreground">
          The requested autograder job {jobId} does not exist.
        </p>
      </main>
    );
  }

  return (
    <main className="min-h-[calc(100vh-4rem)] bg-muted px-8 py-6">
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        <header className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="mb-2 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              <span>Autograder</span>
              <span>/</span>
              <span className="break-all font-mono">{job.id}</span>
            </div>
            <h1 className="text-3xl font-semibold tracking-normal text-foreground">
              Autograder Run
            </h1>
          </div>

          <div className="flex items-center gap-2 rounded-md border bg-background px-3 py-2 text-sm font-medium text-foreground shadow-xs">
            <span>Status: </span>
            {displayGradingJobStatus(job.status)}
            <span aria-hidden>{gradingJobEmoji[job.status]}</span>
          </div>
        </header>

        <div className="grid grid-cols-[20rem_minmax(0,1fr)] gap-6">
          <aside className="sticky top-20 self-start rounded-md border bg-background p-5 shadow-xs">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold text-foreground">Summary</h2>
            </div>

            <div className="mt-5 space-y-5">
              <dl className="text-sm">
                <RunStatus status={job.status} />
              </dl>

              <div>
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Overall score</span>
                  <span className="font-medium">
                    {terminalStatuses.includes(job.status)
                      ? job.score
                      : "Pending"}
                  </span>
                </div>
                <Progress
                  value={terminalStatuses.includes(job.status) ? job.score : 20}
                />
              </div>

              <dl className="space-y-4 text-sm">
                <div>
                  <dt className="text-muted-foreground">Repository</dt>
                  <dd className="mt-1 flex min-w-0 items-center gap-2">
                    <Github className="size-4 shrink-0 text-muted-foreground" />
                    <a
                      href={job.repoURL}
                      target="_blank"
                      rel="noreferrer"
                      className="flex min-w-0 items-center gap-1 font-medium text-blue hover:underline"
                    >
                      <span className="truncate">{job.repoURL}</span>
                      <ExternalLink className="size-3 shrink-0" />
                    </a>
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Job ID</dt>
                  <dd className="mt-1 break-all font-mono text-xs">{job.id}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Response ID</dt>
                  <dd className="mt-1 break-all font-mono text-xs">
                    {job.responseId}
                  </dd>
                </div>
              </dl>
            </div>
          </aside>

          <div className="flex flex-col gap-6">
            <section className="overflow-hidden rounded-md border bg-background shadow-xs">
              <div className="border-b bg-background px-5 py-4">
                <h2 className="text-lg font-semibold text-foreground">Steps</h2>
              </div>

              <div className="divide-y">
                {runnableGradingJobStatuses.map((stepStatus) => {
                  const displayStatus = getStepDisplayStatus(
                    stepStatus,
                    job.status,
                  );

                  return (
                    <div
                      key={stepStatus}
                      className="flex items-center gap-3 px-5 py-4"
                    >
                      <StepIcon
                        stepStatus={stepStatus}
                        displayStatus={displayStatus}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-foreground">
                          {displayGradingJobStatus(stepStatus)}
                        </p>
                        <p className="text-sm capitalize text-muted-foreground">
                          {displayStatus}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}
