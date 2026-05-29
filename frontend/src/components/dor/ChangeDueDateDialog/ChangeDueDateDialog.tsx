import { ChevronDownIcon } from "lucide-react";
import { useEffect, useState } from "react";

import { throwErrorToast } from "@/components/toasts/ErrorToast";
import { throwSuccessToast } from "@/components/toasts/SuccessToast";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
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
  const [popoverOpen, setPopoverOpen] = useState(false);

  useEffect(() => {
    if (open) {
      setDate(form.dueDate.toDate());
    }
  }, [open, form.dueDate]);

  const handleSubmit = () => {
    updateDueDate(
      {
        formId: form.id,
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

        <div className="flex gap-4">
          <div className="flex flex-col gap-3">
            <Label htmlFor="date-picker" className="px-1">
              Date
            </Label>
            <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  id="date-picker"
                  className="w-32 justify-between font-normal"
                >
                  {date ? date.toLocaleDateString() : "Select date"}
                  <ChevronDownIcon />
                </Button>
              </PopoverTrigger>
              <PopoverContent
                className="w-auto overflow-hidden p-0"
                align="start"
              >
                <Calendar
                  mode="single"
                  selected={date}
                  defaultMonth={date}
                  hidden={{ before: new Date() }}
                  onSelect={(newDate) => {
                    if (newDate) setDate(newDate);
                    setPopoverOpen(false);
                  }}
                />
              </PopoverContent>
            </Popover>
          </div>
          <div className="flex flex-col gap-3">
            <Label htmlFor="time-picker" className="px-1">
              Time
            </Label>
            <Input
              type="time"
              id="time-picker"
              step="1"
              value={date.toTimeString().slice(0, 8)}
              onChange={(e) => {
                const [hours, minutes, seconds] = e.target.value
                  .split(":")
                  .map(Number);
                const newDate = new Date(date);
                newDate.setHours(hours ?? 0, minutes ?? 0, seconds ?? 0, 0);
                setDate(newDate);
              }}
              className="bg-background appearance-none [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"
            />
          </div>
        </div>
        <p className="text-sm font-bold text-muted-foreground">
          Due date is in {Intl.DateTimeFormat().resolvedOptions().timeZone}
        </p>

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
