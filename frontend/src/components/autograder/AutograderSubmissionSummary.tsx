import { ExternalLink } from "lucide-react";

import { useApplicantForResponse } from "@/hooks/useApplicants";

type AutograderSubmissionSummaryProps = {
  repoURL: string;
  jobId: string;
  responseId: string;
};

export default function AutograderSubmissionSummary({
  repoURL,
  jobId,
  responseId,
}: AutograderSubmissionSummaryProps) {
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
    <section className="rounded-md border bg-background p-3 shadow-xs">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-foreground">Submission</h2>
      </div>
      <dl className="mt-3 space-y-2.5 text-sm">
        <div>
          <dt className="text-muted-foreground">Applicant</dt>
          <dd className="mt-1 font-medium text-foreground">{applicantName}</dd>
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
  );
}
