import { ClipboardIcon } from "lucide-react";
import { useState } from "react";

import Spinner from "@/components/Spinner";
import { throwErrorToast } from "@/components/toasts/ErrorToast";
import { throwSuccessToast } from "@/components/toasts/SuccessToast";
import { throwWarningToast } from "@/components/toasts/WarningToast";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { getJobsForApplicationResponse } from "@/services/gradingService";
import { buildRepoCloneCommand, pickBestGradingJob } from "@/utils/grading";

export function CopyCloneCommandMenuItem({
  responseId,
}: {
  responseId: string;
}) {
  const [isCopying, setIsCopying] = useState(false);

  const handleCopy = async () => {
    if (isCopying) return;
    setIsCopying(true);

    let command: string | undefined;
    try {
      const jobs = await getJobsForApplicationResponse(responseId);
      const bestJob = pickBestGradingJob(jobs);

      if (!bestJob) {
        throwWarningToast("No autograder runs for this application");
        return;
      }

      command = buildRepoCloneCommand(bestJob.repoURL);
      await navigator.clipboard.writeText(command);
      throwSuccessToast("Clone command copied!");
    } catch (err) {
      console.error("Failed to copy clone command: ", err);
      throwErrorToast(
        command
          ? `Failed to copy clone command: ${command}`
          : "Failed to copy clone command",
      );
    } finally {
      setIsCopying(false);
    }
  };

  return (
    <DropdownMenuItem
      className="cursor-pointer"
      onSelect={(e) => e.preventDefault()}
      onClick={handleCopy}
      disabled={isCopying}
    >
      {isCopying ? <Spinner className="size-4" /> : <ClipboardIcon />}
      {isCopying ? "Copying..." : "Copy Clone Command"}
    </DropdownMenuItem>
  );
}
