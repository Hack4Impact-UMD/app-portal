import { useState } from "react";

import FormSelect from "@/components/admin/FormSelect";
import { throwErrorToast } from "@/components/toasts/ErrorToast";
import { throwSuccessToast } from "@/components/toasts/SuccessToast";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { APPLICATION_INTERVIEW_RUBRICS } from "@/data/rubrics";
import { useAuth } from "@/hooks/useAuth";
import { useUploadInterviewRubrics } from "@/hooks/useInterviewRubrics";

export default function UploadInterviewRubricDialog() {
  const [open, setOpen] = useState(false);
  const [selectedFormId, setSelectedFormId] = useState<string | undefined>();
  const { token } = useAuth();

  const { mutate: uploadInterviewRubrics, isPending: isUploading } =
    useUploadInterviewRubrics();

  const handleUpload = async () => {
    if (!selectedFormId || !token) return;

    uploadInterviewRubrics(
      {
        interviewRubrics: APPLICATION_INTERVIEW_RUBRICS(selectedFormId),
        token: (await token()) ?? "",
      },
      {
        onSuccess: () => {
          throwSuccessToast("Interview rubrics uploaded successfully!");
          setOpen(false);
        },
        onError: (err) => {
          throwErrorToast("Failed to upload interview rubrics");
          console.error(err);
        },
      },
    );
  };

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) setSelectedFormId(undefined);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button disabled={isUploading}>
          {isUploading ? "Uploading..." : "Upload Interview Rubrics"}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Upload Interview Rubrics</DialogTitle>
          <DialogDescription>
            Select the form to upload interview rubrics for. This will upload
            the rubric configuration for interviewers to use when scoring
            candidates.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="form-select" className="text-sm font-medium">
              Select Form
            </Label>
            <FormSelect
              className="w-full"
              selectedId={selectedFormId}
              onValueChange={setSelectedFormId}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={isUploading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleUpload}
            disabled={!selectedFormId || isUploading}
          >
            {isUploading ? "Uploading..." : "Upload"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
