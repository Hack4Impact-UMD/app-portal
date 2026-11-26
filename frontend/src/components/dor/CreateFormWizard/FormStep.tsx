import { CheckCircle2Icon } from "lucide-react";
import { useState } from "react";

import FormSelect from "@/components/admin/FormSelect";
import DueDatePicker from "@/components/DueDatePicker";
import { throwErrorToast } from "@/components/toasts/ErrorToast";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useWizardStep } from "@/components/wizard/Wizard";
import {
  isFormIdTakenError,
  useAllApplicationForms,
  useDuplicateForm,
} from "@/hooks/useApplicationForm";
import { isPrivateForm } from "@/utils/form";

const FORM_ID_PATTERN = /^[a-zA-Z0-9][a-zA-Z0-9_-]*$/;

const defaultDueDate = () => {
  const date = new Date();
  date.setDate(date.getDate() + 14);
  date.setHours(23, 59, 0, 0);
  return date;
};

export function FormStep({
  onCreated,
}: {
  onCreated: (formId: string) => void;
}) {
  const wizard = useWizardStep();
  const { data: forms } = useAllApplicationForms();
  const { mutate: duplicateForm, isPending } = useDuplicateForm();

  const [sourceId, setSourceId] = useState<string>();
  const [formId, setFormId] = useState("");
  const [semester, setSemester] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [dueDate, setDueDate] = useState(defaultDueDate);

  const done = wizard?.state.complete ?? false;
  const locked = done || isPending;
  const source = forms?.find((f) => f.id === sourceId);

  const handleSourceChange = (id: string) => {
    setSourceId(id);
    const form = forms?.find((f) => f.id === id);
    if (form) setIsPrivate(isPrivateForm(form));
  };

  const handleSubmit = () => {
    const id = formId.trim();
    const sem = semester.trim();
    if (!source || !id || !sem) {
      throwErrorToast("Please fill out all fields.");
      return;
    }
    if (dueDate.getTime() <= Date.now()) {
      throwErrorToast("Due date must be in the future.");
      return;
    }
    if (!FORM_ID_PATTERN.test(id)) {
      throwErrorToast(
        "Form ID must start with a letter or number and contain only letters, numbers, hyphens and underscores.",
      );
      return;
    }

    duplicateForm(
      {
        originalForm: source,
        newFormId: id,
        newFormSemester: sem,
        isPrivate,
        dueDate,
      },
      {
        onSuccess: () => {
          onCreated(id);
          wizard?.complete();
        },
        onError: (error) => {
          throwErrorToast(
            isFormIdTakenError(error)
              ? "Form ID already exists"
              : "An error occurred while creating the form.",
          );
          console.error(error);
        },
      },
    );
  };

  return (
    <div className="grid gap-4">
      <p className="text-muted-foreground">
        Select an existing form as a base to copy.
      </p>
      <div className="grid gap-2">
        <Label>Form to duplicate</Label>
        {locked ? (
          <Input
            disabled
            value={source ? `${source.semester} (${source.id})` : ""}
          />
        ) : (
          <FormSelect
            selectedId={sourceId}
            onValueChange={handleSourceChange}
            className="w-full"
          />
        )}
      </div>
      <div className="grid gap-2">
        <Label htmlFor="wizard-form-id">New form ID</Label>
        <Input
          id="wizard-form-id"
          placeholder="fall-2026"
          value={formId}
          disabled={locked}
          onChange={(e) => setFormId(e.target.value)}
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="wizard-form-semester">Semester</Label>
        <Input
          id="wizard-form-semester"
          placeholder="Fall 2026"
          value={semester}
          disabled={locked}
          onChange={(e) => setSemester(e.target.value)}
        />
      </div>
      <div className="grid gap-2">
        <Label>Due date</Label>
        <DueDatePicker
          id="wizard-form-due"
          value={dueDate}
          onChange={setDueDate}
          disabled={locked}
        />
      </div>
      <div className="flex items-start gap-2">
        <Checkbox
          id="wizard-form-private"
          checked={isPrivate}
          disabled={locked}
          onCheckedChange={(checked) => setIsPrivate(checked === true)}
          className="mt-0.5"
        />
        <div className="grid gap-1">
          <Label htmlFor="wizard-form-private">Private form</Label>
          <p className="text-sm text-muted-foreground">
            Private forms are hidden from applicants unless they are invited.
            Invite people from the form's settings menu once it's created.
          </p>
        </div>
      </div>

      {done ? (
        <p className="flex items-center gap-2 text-sm text-blue font-medium">
          <CheckCircle2Icon className="size-4" />
          Created {formId.trim()}. You can edit its questions later in the form
          builder.
        </p>
      ) : (
        <Button
          onClick={handleSubmit}
          disabled={isPending}
          className="justify-self-start"
        >
          {isPending ? "Creating..." : "Create form"}
        </Button>
      )}
    </div>
  );
}
