import { Timestamp } from "firebase/firestore";
import { ChevronDownIcon } from "lucide-react";
import { useState } from "react";

import { throwErrorToast } from "@/components/toasts/ErrorToast";
import { throwSuccessToast } from "@/components/toasts/SuccessToast";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { h4iApplicationForm } from "@/data/h4i-application-form";
import { useUploadApplicationForm } from "@/hooks/useApplicationForm";
import { useAuth } from "@/hooks/useAuth";
import { FormIdTakenError } from "@/services/applicationFormsService";
import type { ApplicationForm } from "@/types/types";

// Two weeks out, at the same time of day — just a sensible starting point
// admins can change afterward via "Change due date".
// Form IDs are used verbatim as Firestore document IDs.
const FORM_ID_PATTERN = /^[a-zA-Z0-9][a-zA-Z0-9_-]*$/;

const defaultDueDate = () => {
  const date = new Date();
  date.setDate(date.getDate() + 14);
  return date;
};

export default function CreatePrivateFormDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [formId, setFormId] = useState("");
  const [semester, setSemester] = useState("");
  const [dueDate, setDueDate] = useState<Date>(defaultDueDate());
  const [popoverOpen, setPopoverOpen] = useState(false);

  const { token } = useAuth();
  const { mutate: uploadForm, isPending } = useUploadApplicationForm();

  const handleSubmit = async () => {
    if (!formId.trim() || !semester.trim()) {
      throwErrorToast("Please fill out all fields.");
      return;
    }

    // Matches the backend's check — the ID is used as-is for the Firestore
    // document ID, so "/" in particular would write the form to a different
    // path. Checked here too so the admin finds out before the round trip.
    if (!FORM_ID_PATTERN.test(formId.trim())) {
      throwErrorToast(
        "Form ID must start with a letter or number and contain only letters, numbers, hyphens and underscores.",
      );
      return;
    }

    const tok = await token();
    if (!tok) {
      throwErrorToast("Not authenticated.");
      return;
    }

    const newForm: ApplicationForm = {
      ...h4iApplicationForm,
      id: formId.trim(),
      semester: semester.trim(),
      dueDate: Timestamp.fromDate(dueDate),
      isActive: false,
      isPrivate: true,
      invitedUsers: [],
      decisionsReleased: false,
    };

    uploadForm(
      // createOnly so a taken ID is rejected by the backend rather than
      // silently overwriting the existing form with that ID.
      { form: newForm, token: tok, createOnly: true },
      {
        onSuccess: () => {
          throwSuccessToast(
            "Private form created. Edit its content in the form builder, then invite users.",
          );
          setFormId("");
          setSemester("");
          setDueDate(defaultDueDate());
          onOpenChange(false);
        },
        onError: (error) => {
          throwErrorToast(
            error instanceof FormIdTakenError
              ? "Form ID already exists"
              : "An error occurred while creating the form.",
          );
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
          <DialogTitle>Create Private Form</DialogTitle>
          <DialogDescription>
            A private form starts inactive and hidden from all applicants. Once
            created, invite the users who should see it from the form dropdown
            menu.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4">
          <div className="grid gap-3">
            <Label htmlFor="private-form-id">Form ID</Label>
            <Input
              id="private-form-id"
              placeholder="unique-form-id"
              value={formId}
              onChange={(e) => setFormId(e.target.value)}
            />
          </div>
          <div className="grid gap-3">
            <Label htmlFor="private-form-semester">Semester</Label>
            <Input
              id="private-form-semester"
              placeholder="Fall 2025"
              value={semester}
              onChange={(e) => setSemester(e.target.value)}
            />
          </div>
          <div className="grid gap-3">
            <Label htmlFor="private-form-due-date" className="px-1">
              Due Date
            </Label>
            <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  id="private-form-due-date"
                  className="w-full justify-between font-normal"
                >
                  {dueDate.toLocaleString()}
                  <ChevronDownIcon />
                </Button>
              </PopoverTrigger>
              <PopoverContent
                className="w-auto overflow-hidden p-0"
                align="start"
              >
                <Calendar
                  mode="single"
                  selected={dueDate}
                  defaultMonth={dueDate}
                  hidden={{ before: new Date() }}
                  onSelect={(newDate) => {
                    if (newDate) {
                      const merged = new Date(newDate);
                      merged.setHours(
                        dueDate.getHours(),
                        dueDate.getMinutes(),
                        dueDate.getSeconds(),
                        0,
                      );
                      setDueDate(merged);
                    }
                    setPopoverOpen(false);
                  }}
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button type="submit" onClick={handleSubmit} disabled={isPending}>
            {isPending ? "Creating..." : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
