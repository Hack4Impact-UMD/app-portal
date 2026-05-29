import { useState } from "react";

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
import { useDuplicateForm } from "@/hooks/useApplicationForm";
import { useAuth } from "@/hooks/useAuth";
import type { ApplicationForm } from "@/types/types";

export default function DuplicateFormDialog({
  open,
  onOpenChange,
  form,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  form: ApplicationForm;
}) {
  const [newFormId, setNewFormId] = useState("");
  const [newFormSemester, setNewFormSemester] = useState("");
  const { token } = useAuth();
  const { mutate: duplicateForm, isPending } = useDuplicateForm();

  const handleSubmit = async () => {
    if (!newFormId.trim() || !newFormSemester.trim()) {
      throwErrorToast("Please fill out all fields.");
      return;
    }
    const tok = await token();
    if (!tok) {
      throwErrorToast("Not authenticated.");
      return;
    }
    duplicateForm(
      {
        originalForm: form,
        newFormId: newFormId.trim(),
        newFormSemester: newFormSemester.trim(),
        token: tok,
      },
      {
        onSuccess: () => {
          throwSuccessToast("Application form has been duplicated.");
          onOpenChange(false);
        },
        onError: (error) => {
          throwErrorToast("An error occurred while duplicating the form.");
          console.error(error);
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
          <DialogTitle>Duplicate Application Form</DialogTitle>
          <DialogDescription>
            Please enter the following details to duplicate the {form.id} form.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4">
          <div className="grid gap-3">
            <Label htmlFor="form-id">New Form ID</Label>
            <Input
              id="form-id"
              name="ID"
              placeholder="unique-form-id"
              value={newFormId}
              onChange={(e) => setNewFormId(e.target.value)}
            />
          </div>
          <div className="grid gap-3">
            <Label htmlFor="semester">New Form Semester</Label>
            <Input
              id="semester"
              name="Semester"
              placeholder="Fall 2025"
              value={newFormSemester}
              onChange={(e) => setNewFormSemester(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button type="submit" onClick={handleSubmit} disabled={isPending}>
            {isPending ? "Duplicating..." : "Duplicate"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
