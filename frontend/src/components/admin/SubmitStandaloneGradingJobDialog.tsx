import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { throwErrorToast } from "@/components/toasts/ErrorToast";
import { throwSuccessToast } from "@/components/toasts/SuccessToast";
import { Button } from "@/components/ui/button";
import {
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
  Dialog,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { useSubmitStandaloneGradingJob } from "@/hooks/useGrading";
import { extractGithubRepoPath } from "@/utils/grading";

export default function SubmitStandaloneGradingJobDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { mutate: submitStandaloneGradingJob, isPending } =
    useSubmitStandaloneGradingJob();
  const { token } = useAuth();
  const navigate = useNavigate();
  const [assessmentRepo, setAssessmentRepo] = useState("");
  const [testRepo, setTestRepo] = useState("");

  useEffect(() => {
    if (open) {
      setAssessmentRepo("");
      setTestRepo("");
    }
  }, [open]);

  const handleSubmit = async () => {
    if (!token) {
      throwErrorToast("Authentication token not available");
      return;
    }

    const assessmentPath = extractGithubRepoPath(assessmentRepo);
    if (!assessmentPath) {
      throwErrorToast(
        "Enter a valid assessment repo URL, e.g. https://github.com/you/repo",
      );
      return;
    }

    const testPath = extractGithubRepoPath(testRepo);
    if (!testPath) {
      throwErrorToast(
        "Enter a valid test repo URL, e.g. https://github.com/you/repo",
      );
      return;
    }

    try {
      submitStandaloneGradingJob(
        {
          repoURL: assessmentPath,
          testRepo: testPath,
          token: (await token()) ?? "",
        },
        {
          onSuccess: (jobId) => {
            throwSuccessToast(
              `Grading job queued successfully! Job ID: ${jobId}`,
            );
            onOpenChange(false);
            navigate(`/autograder/${jobId}`);
          },
        },
      );
    } catch (err) {
      console.error(err);
      throwErrorToast("Not authenticated");
    }
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
          <DialogTitle>Submit Standalone Grading Job</DialogTitle>
          <DialogDescription>
            Grade an assessment repo against a test repo, with no application
            response attached. This will queue the autograder to run tests.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="assessment-repo">Assessment repo URL</Label>
            <Input
              id="assessment-repo"
              placeholder="https://github.com/username/assessment"
              value={assessmentRepo}
              onChange={(e) => setAssessmentRepo(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="test-repo">Test repo URL</Label>
            <Input
              id="test-repo"
              placeholder="https://github.com/username/tests"
              value={testRepo}
              onChange={(e) => setTestRepo(e.target.value)}
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
            disabled={isPending || !assessmentRepo.trim() || !testRepo.trim()}
          >
            {isPending ? "Submitting..." : "Submit Job"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
