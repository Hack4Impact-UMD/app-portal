import {
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
  Dialog,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { throwErrorToast } from "@/components/toasts/ErrorToast";
import { throwSuccessToast } from "@/components/toasts/SuccessToast";
import { useSubmitGradingJob } from "@/hooks/useGrading";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";

export default function SubmitGradingJobDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { mutate: submitGradingJob, isPending } = useSubmitGradingJob();
  const { token } = useAuth();
  const [responseId, setResponseId] = useState("");
  const [repoURL, setRepoURL] = useState("");

  useEffect(() => {
    if (open) {
      setResponseId("");
      setRepoURL("");
    }
  }, [open]);

  const handleSubmit = async () => {
    if (!token) {
      throwErrorToast("Authentication token not available");
      return;
    }

    const normalizedResponseId = responseId.trim();
    const normalizedRepoUrl = repoURL.trim();

    if (!normalizedResponseId || !normalizedRepoUrl) {
      throwErrorToast("Response ID or repo URL not provided");
      return;
    }

    submitGradingJob(
      {
        responseId: normalizedResponseId,
        repoURL: normalizedRepoUrl,
        token: (await token()) ?? "",
      },
      {
        onSuccess: (jobId) => {
          throwSuccessToast(
            `Grading job queued successfully! Job ID: ${jobId}`,
          );
          onOpenChange(false);
        },
        onError: (error) => {
          throwErrorToast("Failed to submit grading job: " + error.message);
        },
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        onCloseAutoFocus={(event) => {
          event.preventDefault();
          document.body.style.pointerEvents = "";
        }}
      >
        <DialogHeader>
          <DialogTitle>Submit Grading Job</DialogTitle>
          <DialogDescription>
            Submit a grading job for an application response. This will queue
            the autograder to run tests.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="response-id">Application Response ID</Label>
            <Input
              id="response-id"
              placeholder="Enter response ID"
              value={responseId}
              onChange={(e) => setResponseId(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="repo-url">Repository URL</Label>
            <Input
              id="repo-url"
              placeholder="https://github.com/username/repo"
              value={repoURL}
              onChange={(e) => setRepoURL(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button
            type="submit"
            onClick={handleSubmit}
            disabled={isPending || !responseId.trim() || !repoURL.trim()}
          >
            {isPending ? "Submitting..." : "Submit Job"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
