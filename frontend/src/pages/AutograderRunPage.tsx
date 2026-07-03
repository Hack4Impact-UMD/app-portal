import { GradingJobStatus, PermissionRole } from "@app-portal/shared/constants";
import { CircleAlert } from "lucide-react";
import { useParams } from "react-router-dom";

import AutograderJobHistoryList from "@/components/autograder/AutograderJobHistoryList";
import AutograderTestResults from "@/components/autograder/AutograderPublicTestResults";
import AutograderRunStatusSummary from "@/components/autograder/AutograderRunStatusSummary";
import AutograderStepList from "@/components/autograder/AutograderStepList";
import AutograderSubmissionSummary from "@/components/autograder/AutograderSubmissionSummary";
import Loading from "@/components/Loading";
import { useAuth } from "@/hooks/useAuth";
import {
  useGradingJobInternalSnapshot,
  useGradingJobSnapshot,
} from "@/hooks/useGrading";
import {
  getGradingJobMaxScore,
  gradingJobEmoji,
  gradingJobStatusLabels,
} from "@/utils/display";

export default function AutograderRunPage() {
  const { jobId } = useParams();
  const { user } = useAuth();
  const canReadInternalJob = !!user && user.role !== PermissionRole.Applicant;

  const { data: job, isPending, error } = useGradingJobSnapshot(jobId);
  const {
    data: internalJob,
    isPending: isInternalJobPending,
    error: internalJobError,
  } = useGradingJobInternalSnapshot(jobId, canReadInternalJob);

  if (isPending || (canReadInternalJob && isInternalJobPending)) {
    return <Loading />;
  }

  if (error || !job || (canReadInternalJob && internalJobError)) {
    return (
      <main className="flex h-screen flex-col items-center justify-center bg-muted p-8 text-center">
        <CircleAlert className="mb-4 size-12 text-destructive" />
        <h1 className="text-3xl font-semibold text-foreground">
          Failed to load autograder job! ID: {jobId}
        </h1>
        <p className="mt-2 max-w-md text-muted-foreground">
          {error?.message ??
            "The requested autograder job could not be loaded."}
        </p>
      </main>
    );
  }

  const maxScore = getGradingJobMaxScore(job);

  return (
    <main className="min-h-[calc(100vh-4rem)] bg-muted px-8 pb-12 pt-6">
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
            {gradingJobStatusLabels[job.status]}
            <span aria-hidden>{gradingJobEmoji[job.status]}</span>
          </div>
        </header>

        <div className="grid grid-cols-[20rem_minmax(0,1fr)] gap-6">
          <aside className="sticky top-20 flex self-start flex-col gap-3">
            <AutograderRunStatusSummary
              status={job.status}
              score={job.score}
              maxScore={maxScore}
              started={job.started}
              updated={job.updated}
              durationMs={job.updated.toMillis() - job.started.toMillis()}
            />
            <AutograderSubmissionSummary
              repoURL={job.repoURL}
              jobId={job.id}
              responseId={job.responseId}
            />
            <AutograderJobHistoryList
              responseId={job.responseId}
              currentJobId={job.id}
            />
          </aside>

          <div className="flex flex-col gap-6">
            <AutograderStepList
              status={job.status}
              errorStep={job.errorStep}
              logs={
                internalJob
                  ? {
                      [GradingJobStatus.Installing]: internalJob.installLog,
                      [GradingJobStatus.Building]: internalJob.buildLog,
                      [GradingJobStatus.Testing]: internalJob.playwrightLog,
                    }
                  : undefined
              }
              cloneDurationMs={job.cloneDurationMs}
              installDurationMs={job.installDurationMs}
              buildDurationMs={job.buildDurationMs}
              testingDurationMs={job.testingDurationMs}
            />

            <AutograderTestResults
              suiteResults={job.suiteResults}
              publicTests={internalJob?.tests ?? job.publicTests}
              internal={!!internalJob}
            />

            <div className="text-sm bg-amber-50 p-2 text-muted-foreground rounded border border-amber-300">
              <p className="">
                Your submission was automatically graded by{" "}
                <a
                  href="https://github.com/Hack4Impact-UMD/professor"
                  target="_blank"
                  className="underline text-blue"
                >
                  Professor
                </a>
                ! This is not your final score, we take into consideration other
                factors like code quality, style, and visuals when evaluating
                techical assessment submissions.
              </p>

              <p className="mt-1">
                Professor is a new project, so there may be bugs. If you
                experience any issues, please let us know (click your profile
                &gt; About &gt; Report an Issue).
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
