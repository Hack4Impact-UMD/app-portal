import { CheckIcon, ClipboardIcon, ExternalLink } from "lucide-react";
import { useState } from "react";

import { throwErrorToast } from "@/components/toasts/ErrorToast";
import { Button } from "@/components/ui/button";
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

  const [repoCopied, setRepoCopied] = useState(false);
  const repoLink = `https://github.com/${repoURL}`;

  const handleCopyRepo = async () => {
    try {
      await navigator.clipboard.writeText(repoLink);
      setRepoCopied(true);
      setTimeout(() => setRepoCopied(false), 1500);
    } catch {
      throwErrorToast("Failed to copy");
      setRepoCopied(false);
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
      </div>
      <dl className="mt-3 space-y-2.5 text-sm">
        <div>
          <dt className="text-muted-foreground">Applicant</dt>
          <dd className="mt-1 font-medium text-foreground">{applicantName}</dd>
        </div>
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
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="size-6 shrink-0"
              onClick={handleCopyRepo}
              title="Copy repository link"
            >
              {repoCopied ? (
                <CheckIcon className="size-3" />
              ) : (
                <ClipboardIcon className="size-3" />
              )}
            </Button>
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
