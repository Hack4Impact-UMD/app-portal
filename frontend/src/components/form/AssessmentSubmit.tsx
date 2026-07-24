import { GradingJobStatus } from "@app-portal/shared/constants";
import { SendIcon } from "lucide-react";
import React, { memo, useMemo, useState } from "react";
import { twMerge } from "tailwind-merge";

import AutograderJobCard from "@/components/autograder/AutograderJobCard";
import { throwErrorToast } from "@/components/toasts/ErrorToast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import {
  useJobsForApplicationResponse,
  useSubmitGradingJob,
} from "@/hooks/useGrading";
import {
  isTerminalGradingJobStatus,
  extractGithubRepoPath,
} from "@/utils/grading";

import FormMarkdown from "./FormMarkdown";

interface AssessmentSubmitProps {
  question: string;
  label?: string;
  isRequired?: boolean;
  value: string;
  onChange: (value: string) => void;
  className?: string;
  minWords?: number;
  maxWords?: number;
  disabled?: boolean;
  errorMessage?: string;
  placeholderText?: string;
  responseId?: string;
}

const AssessmentSubmit: React.FC<AssessmentSubmitProps> = ({
  question,
  label,
  isRequired,
  onChange,
  className = "",
  disabled,
  errorMessage,
  placeholderText = "",
  responseId,
}) => {
  const { token } = useAuth();
  const [repoUrl, setRepoUrl] = useState("");
  const [urlError, setUrlError] = useState<string | null>(null);

  const {
    data: jobs,
    isPending,
    error,
  } = useJobsForApplicationResponse(responseId);
  const { mutate: submitGradingJob, isPending: isSubmitting } =
    useSubmitGradingJob();

  const bestJob = useMemo(() => {
    if (!jobs || jobs.length === 0) return null;

    // jobs are ordered most recent first, so ties keep the most recent job
    return jobs.reduce((best, current) =>
      current.score > best.score ? current : best,
    );
  }, [jobs]);

  const latestJob = jobs?.[0];

  const handleSubmit = async () => {
    const repoPath = extractGithubRepoPath(repoUrl);
    if (!repoPath) {
      setUrlError("Enter a valid GitHub URL, e.g. https://github.com/you/repo");
      return;
    }

    if (!responseId) {
      throwErrorToast("Missing application response ID");
      return;
    }

    let resolvedToken: string | undefined;
    try {
      resolvedToken = await token();
    } catch (err) {
      console.error(err);
      throwErrorToast("Authentication token not available");
      return;
    }

    if (!resolvedToken) {
      throwErrorToast("Authentication token not available");
      return;
    }

    setUrlError(null);

    submitGradingJob(
      {
        responseId,
        repoURL: repoPath,
        token: resolvedToken,
      },
      {
        onSuccess: (jobId) => {
          onChange(jobId);
        },
      },
    );
  };

  return (
    <main className={twMerge("flex flex-col", className)}>
      <span className="mb-2 text-xl font-normal">
        {question}
        {isRequired && <span className="text-red-600 ml-px">*</span>}
        {!isRequired && <span className="font-light text-xs"> (Optional)</span>}
      </span>

      <FormMarkdown>{label}</FormMarkdown>

      <div className="flex flex-col gap-2">
        {!isPending &&
          (error ? (
            <p className="text-sm bg-white border px-2 py-1 rounded text-red-600">
              Failed to load grading job submissions. Please try again.
            </p>
          ) : !jobs || jobs.length === 0 ? (
            <p className="text-sm bg-white border px-2 py-1 rounded text-muted-foreground">
              No grading job submissions yet. Submit your repo to see your
              preliminary score.
            </p>
          ) : (
            bestJob && (
              <AutograderJobCard header="Best Score" jobId={bestJob.id} />
            )
          ))}

        {latestJob && latestJob.id !== bestJob?.id && (
          <AutograderJobCard header="Latest Run" jobId={latestJob.id} />
        )}
        <div className="w-full flex flex-row gap-1">
          <Input
            className={twMerge(
              "grow mt-auto p-2 w-full bg-white rounded-md outline outline-black border-2 transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-100 disabled:bg-[#f3f4f6]",
            )}
            required={isRequired}
            value={repoUrl}
            onChange={(e) => {
              setRepoUrl(e.target.value);
              if (urlError) setUrlError(null);
            }}
            disabled={disabled || isSubmitting}
            placeholder={placeholderText || "Enter your response..."}
          />

          <Button
            onClick={handleSubmit}
            disabled={
              isPending ||
              !isTerminalGradingJobStatus(
                latestJob?.status ?? GradingJobStatus.Completed,
              ) ||
              disabled ||
              isSubmitting
            }
          >
            Submit <SendIcon />
          </Button>
        </div>
        {urlError && <p className="text-red-600 text-sm">{urlError}</p>}
        <p className="text-muted-foreground text-sm">You can resubmit your assessment as many times as you'd like. We will only keep your highest score.</p>
      </div>

      {errorMessage && <p className="text-red-600">{errorMessage}</p>}
    </main>
  );
};

export default memo(AssessmentSubmit);
