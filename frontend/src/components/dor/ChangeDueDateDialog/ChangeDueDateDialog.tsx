import { useEffect, useState } from "react";

import DueDatePicker from "@/components/DueDatePicker";
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
import { useUpdateApplicationFormDueDate } from "@/hooks/useApplicationForm";
import type { ApplicationForm } from "@/types/types";

export default function ChangeDueDateDialog({
  open,
  onOpenChange,
  form,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  form: ApplicationForm;
}) {
  const { mutate: updateDueDate, isPending } =
    useUpdateApplicationFormDueDate();
  const [date, setDate] = useState<Date>(form.dueDate.toDate());

  useEffect(() => {
    if (open) {
      setDate(form.dueDate.toDate());
    }
  }, [open, form.dueDate]);

  const handleSubmit = () => {
    updateDueDate(
      {
        id: form.id,
        dueDate: date,
      },
      {
        onSuccess: () => {
          throwSuccessToast("Due date updated successfully!");
          onOpenChange(false);
        },
        onError: () => {
          throwErrorToast("Failed to update due date");
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
          <DialogTitle>Change Application Form Due Date</DialogTitle>
          <DialogDescription>
            Enter the new due date for the {form.id} form below.
          </DialogDescription>
        </DialogHeader>

        <DueDatePicker id="due-date" value={date} onChange={setDate} />

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button type="submit" onClick={handleSubmit} disabled={isPending}>
            {isPending ? "Updating..." : "Set due date"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
