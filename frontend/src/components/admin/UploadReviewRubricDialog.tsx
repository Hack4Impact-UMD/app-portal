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
import { APPLICATION_RUBRICS } from "@/data/rubrics";
import { useAuth } from "@/hooks/useAuth";
import { useUploadRubrics } from "@/hooks/useRubrics";

export default function UploadReviewRubricDialog() {
  const [open, setOpen] = useState(false);
  const [selectedFormId, setSelectedFormId] = useState<string | undefined>();
  const { token } = useAuth();

  const { mutate: uploadRubrics, isPending: isUploading } = useUploadRubrics();

  const handleUpload = async () => {
    if (!selectedFormId || !token) return;

    uploadRubrics(
      {
        rubrics: APPLICATION_RUBRICS(selectedFormId),
        token: (await token()) ?? "",
      },
      {
        onSuccess: () => {
          throwSuccessToast("Review rubrics uploaded successfully!");
          setOpen(false);
        },
        onError: (err) => {
          throwErrorToast("Failed to upload review rubrics");
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
          {isUploading ? "Uploading..." : "Upload Review Rubrics"}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Upload Review Rubrics</DialogTitle>
          <DialogDescription>
            Select the form to upload review rubrics for. This will upload the
            rubric configuration for reviewers to use when scoring applications.
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
