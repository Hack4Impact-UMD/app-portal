import type { GradingJobStatus } from "@app-portal/shared/constants";
import { PermissionRole } from "@app-portal/shared/constants";
import { ExternalLink, RotateCwIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { throwErrorToast } from "@/components/toasts/ErrorToast";
import { Button } from "@/components/ui/button";
import { useApplicantForResponse } from "@/hooks/useApplicants";
import { useAuth } from "@/hooks/useAuth";
import {
  useSubmitGradingJob,
  useSubmitStandaloneGradingJob,
} from "@/hooks/useGrading";
import { isTerminalGradingJobStatus } from "@/utils/grading";

type AutograderSubmissionSummaryProps = {
  repoURL: string;
  jobId: string;
  responseId: string;
  status: GradingJobStatus;
  isStandalone: boolean;
  testRepo?: string;
};

export default function AutograderSubmissionSummary({
  repoURL,
  jobId,
  responseId,
  status,
  isStandalone,
  testRepo,
}: AutograderSubmissionSummaryProps) {
  const {
    data: applicant,
    isPending: isApplicantPending,
    error: applicantError,
  } = useApplicantForResponse(isStandalone ? undefined : responseId);
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const { mutate: submitGradingJob, isPending: isRerunningResponse } =
    useSubmitGradingJob();
  const {
    mutate: submitStandaloneGradingJob,
    isPending: isRerunningStandalone,
  } = useSubmitStandaloneGradingJob();
  const isRerunning = isRerunningResponse || isRerunningStandalone;

  const canRerun =
    !!user &&
    (user.role === PermissionRole.Board ||
      user.role === PermissionRole.SuperReviewer ||
      (user.role === PermissionRole.Applicant && user.id === applicant?.id));

  const repoLink = `https://github.com/${repoURL}`;

  const handleRerun = async () => {
    if (!token) {
      throwErrorToast("Authentication token not available");
      return;
    }

    if (isStandalone && !testRepo) {
      throwErrorToast("Test repo not available for this standalone job");
      return;
    }

    try {
      const authToken = (await token()) ?? "";
      const onSuccess = (newJobId: string) => {
        navigate(`/autograder/${newJobId}`);
      };

      if (isStandalone) {
        submitStandaloneGradingJob(
          { repoURL, testRepo: testRepo!, token: authToken },
          { onSuccess },
        );
      } else {
        submitGradingJob(
          { responseId, repoURL, token: authToken },
          { onSuccess },
        );
      }
    } catch (err) {
      console.error(err);
      throwErrorToast("Not authenticated");
    }
  };

  const applicantName = applicant
    ? `${applicant.firstName} ${applicant.lastName}`
    : isApplicantPending
      ? "Loading..."
      : applicantError
        ? "Unable to load applicant"
        : "Unknown applicant";

  return (
    <section className="rounded-md border bg-background p-3 shadow-xs">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-foreground">Submission</h2>
        {canRerun && (
          <Button
            type="button"
            size="sm"
            className="h-8 text-xs"
            onClick={handleRerun}
            disabled={!isTerminalGradingJobStatus(status) || isRerunning}
          >
            <RotateCwIcon className="size-3.5" />
            {isRerunning ? "Re-running..." : "Re-run job"}
          </Button>
        )}
      </div>
      <dl className="mt-3 space-y-2.5 text-sm">
        {isStandalone ? (
          <div>
            <dt className="text-muted-foreground">Type</dt>
            <dd className="mt-1 font-medium text-foreground">
              Standalone (no application response)
            </dd>
          </div>
        ) : (
          <div>
            <dt className="text-muted-foreground">Applicant</dt>
            <dd className="mt-1 font-medium text-foreground">
              {applicantName}
            </dd>
          </div>
        )}
        <div>
          <dt className="text-muted-foreground">Repository</dt>
          <dd className="mt-1 flex min-w-0 items-center gap-2">
            <a
              href={repoLink}
              target="_blank"
              rel="noreferrer"
              className="flex min-w-0 items-center gap-1 font-medium text-blue hover:underline"
            >
              <span className="truncate">github.com/{repoURL}</span>
              <ExternalLink className="size-3 shrink-0" />
            </a>
          </dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Job ID</dt>
          <dd className="mt-1 break-all font-mono text-xs">{jobId}</dd>
        </div>
        {!isStandalone && (
          <div>
            <dt className="text-muted-foreground">Response ID</dt>
            <dd className="mt-1 break-all font-mono text-xs">{responseId}</dd>
          </div>
        )}
      </dl>
    </section>
  );
}
