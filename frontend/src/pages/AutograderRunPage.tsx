import { GradingJobStatus } from "@app-portal/shared/constants";
import { Timestamp } from "firebase/firestore";
import {
  Circle,
  CircleAlert,
  ExternalLink,
  Github,
  LoaderCircle,
} from "lucide-react";
import { useParams } from "react-router-dom";

import { Progress } from "@/components/ui/progress";
import type { GradingJobPublic } from "@/types/types";
import { displayGradingJobStatus, gradingJobEmoji } from "@/utils/display";

const gradingJobStatuses = Object.values(GradingJobStatus);

const fakeJob: GradingJobPublic = {
  id: "746c5437-a43f-4c10-8485-b96b61c6d0da",
  responseId: "response-id-pending",
  repoURL: "https://github.com/example/repo",
  status: GradingJobStatus.Serving,
  score: 72,
  totalTests: 25,
  completedTests: 12,
  suiteResults: {},
  publicTests: {},
  started: Timestamp.now(),
  updated: Timestamp.now(),
};

type StepDisplayStatus = "complete" | "active" | "pending";
const terminalStatuses = [GradingJobStatus.Completed, GradingJobStatus.Failed];

function getStepDisplayStatus(
  stepStatus: GradingJobStatus,
  currentStatus: GradingJobStatus,
): StepDisplayStatus {
  const stepIndex = gradingJobStatuses.indexOf(stepStatus);
  const currentIndex = gradingJobStatuses.indexOf(currentStatus);

  if (stepIndex < currentIndex) return "complete";
  if (stepIndex === currentIndex) return "active";
  return "pending";
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
  const job = jobId === fakeJob.id ? fakeJob : undefined;
  const hasTerminalStatus =
    job !== undefined && terminalStatuses.includes(job.status);

  if (!job) {
    return (
      <main className="flex h-screen flex-col items-center justify-center bg-muted p-8 text-center">
        <CircleAlert className="mb-4 size-12 text-destructive" />
        <h1 className="text-3xl font-semibold text-foreground">
          Autograder job not found
        </h1>
        <p className="mt-2 text-muted-foreground">
          The requested autograder job does not exist.
        </p>
      </main>
    );
  }

  return (
    <main className="min-h-full bg-muted px-8 py-6">
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
            <span aria-hidden>{gradingJobEmoji[job.status]}</span>
            {displayGradingJobStatus(job.status)}
          </div>
        </header>

        <div className="grid grid-cols-[20rem_minmax(0,1fr)] gap-6">
          <aside className="rounded-md border bg-background p-5 shadow-xs">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold text-foreground">Summary</h2>
            </div>

            <div className="mt-5 space-y-5">
              <div>
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Overall score</span>
                  <span className="font-medium">
                    {hasTerminalStatus ? job.score : "Pending"}
                  </span>
                </div>
                <Progress value={hasTerminalStatus ? job.score : 20} />
              </div>

              <dl className="space-y-4 text-sm">
                <div>
                  <dt className="text-muted-foreground">Status</dt>
                  <dd className="mt-1 font-medium">
                    {displayGradingJobStatus(job.status)}
                  </dd>
                </div>
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
                  <dd className="mt-1 flex items-center gap-2">
                    <span className="break-all font-mono text-xs">
                      {job.id}
                    </span>
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Response ID</dt>
                  <dd className="mt-1 flex items-center gap-2">
                    <span className="break-all font-mono text-xs">
                      {job.responseId}
                    </span>
                  </dd>
                </div>
              </dl>
            </div>
          </aside>

          <section className="rounded-md border bg-background shadow-xs">
            <div className="border-b px-5 py-4">
              <h2 className="text-lg font-semibold text-foreground">Steps</h2>
            </div>

            <div className="divide-y">
              {gradingJobStatuses.map((stepStatus) => {
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
    </main>
  );
}
