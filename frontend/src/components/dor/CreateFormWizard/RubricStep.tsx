import type { ApplicantRole } from "@app-portal/shared/constants";
import type { RoleReviewRubric } from "@app-portal/shared/types";
import type { RubricValidationWarnings } from "@app-portal/shared/utils";
import { validateRubricScoreKeys } from "@app-portal/shared/utils";
import { AlertTriangleIcon, CheckCircle2Icon } from "lucide-react";
import { useState } from "react";

import FormSelect from "@/components/admin/FormSelect";
import Spinner from "@/components/Spinner";
import { throwErrorToast } from "@/components/toasts/ErrorToast";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useWizardStep } from "@/components/wizard/Wizard";
import { isTRPCClientError } from "@/config/trpc";
import { useApplicationForm } from "@/hooks/useApplicationForm";
import { useInterviewRubricsForForm } from "@/hooks/useInterviewRubrics";
import {
  useCreateRubricsForForm,
  useDuplicateRubricsFromForm,
  useRubricsForForm,
} from "@/hooks/useRubrics";
import type { ApplicationForm } from "@/types/types";
import { displayApplicantRoleNameNoEmoji } from "@/utils/display";

type Mode = "copy" | "empty";
type Weights = ApplicationForm["scoreWeights"];

export function RubricStep({ formId }: { formId: string }) {
  const wizard = useWizardStep();
  const { data: form, isPending: formPending } = useApplicationForm(
    formId,
    false,
  );
  const [mode, setMode] = useState<Mode>("copy");
  const [sourceId, setSourceId] = useState<string>();

  const duplicate = useDuplicateRubricsFromForm();
  const create = useCreateRubricsForForm();
  const isPending = duplicate.isPending || create.isPending;
  const done = wizard?.state.complete ?? false;
  const locked = done || isPending;

  const { data: reviewRubrics, isFetching: reviewFetching } =
    useRubricsForForm(sourceId);
  const { data: interviewRubrics, isFetching: interviewFetching } =
    useInterviewRubricsForForm(sourceId);

  if (formPending || !form) {
    return (
      <div className="flex justify-center p-4">
        <Spinner />
      </div>
    );
  }

  const source =
    sourceId &&
    !reviewFetching &&
    !interviewFetching &&
    reviewRubrics &&
    interviewRubrics
      ? {
          review: {
            rubrics: reviewRubrics,
            warnings: validateRubricScoreKeys(reviewRubrics, form.scoreWeights),
          },
          interview: {
            rubrics: interviewRubrics,
            warnings: validateRubricScoreKeys(
              interviewRubrics,
              form.interviewScoreWeights,
            ),
          },
        }
      : undefined;
  const sourceMatches =
    !!source &&
    !hasWarnings(source.review.warnings) &&
    !hasWarnings(source.interview.warnings);

  const onSuccess = () => wizard?.complete();
  const onError = (error: unknown) => {
    throwErrorToast(
      isConflict(error)
        ? "This form already has rubrics."
        : "An error occurred while creating rubrics.",
    );
    console.error(error);
  };

  const handleSubmit = () => {
    if (mode === "empty") {
      create.mutate({ formId }, { onSuccess, onError });
    } else if (sourceId) {
      duplicate.mutate(
        { sourceFormId: sourceId, destFormId: formId },
        { onSuccess, onError },
      );
    }
  };

  return (
    <div className="grid gap-4">
      <p className="text-sm text-muted-foreground">
        Import an existing form's rubrics or create new empty rubrics for the
        new form.
      </p>

      <ToggleGroup
        type="single"
        variant="outline"
        value={mode}
        disabled={locked}
        onValueChange={(v) => v && setMode(v as Mode)}
        className="w-full"
      >
        <ToggleGroupItem
          value="copy"
          className="grow data-[state=on]:bg-blue data-[state=on]:text-white"
        >
          Copy existing rubrics
        </ToggleGroupItem>
        <ToggleGroupItem
          value="empty"
          className="grow data-[state=on]:bg-blue data-[state=on]:text-white"
        >
          Create empty rubrics
        </ToggleGroupItem>
      </ToggleGroup>

      {mode === "copy" ? (
        <div className="grid gap-3">
          <Label>Copy rubrics from</Label>
          <FormSelect
            selectedId={sourceId}
            onValueChange={setSourceId}
            className="w-full"
          />
          {sourceId && !source && <Spinner />}
          {source && (
            <div className="grid gap-2 text-sm">
              <SourceSummary label="Application" {...source.review} />
              <SourceSummary label="Interview" {...source.interview} />
            </div>
          )}
        </div>
      ) : (
        <div className="grid gap-2 text-sm">
          <p className="text-muted-foreground">
            The rubrics will include keys for corresponding to the new form's
            interview and review score weights.
          </p>
        </div>
      )}

      {done ? (
        <p className="flex items-center gap-2 text-sm text-blue font-medium">
          <CheckCircle2Icon className="size-4" />
          Rubrics created for {form.id}.
        </p>
      ) : (
        <Button
          onClick={handleSubmit}
          disabled={isPending || (mode === "copy" && !sourceMatches)}
          className="justify-self-start"
        >
          {isPending
            ? "Creating..."
            : mode === "copy"
              ? "Copy rubrics"
              : "Create rubrics"}
        </Button>
      )}
    </div>
  );
}

function hasWarnings(w: RubricValidationWarnings) {
  return w.missingInForm.length > 0 || w.missingInRubric.length > 0;
}

function isConflict(error: unknown) {
  return isTRPCClientError(error) && error.data?.code === "CONFLICT";
}

function SourceSummary({
  label,
  rubrics,
  warnings,
}: {
  label: string;
  rubrics: RoleReviewRubric[];
  warnings: RubricValidationWarnings;
}) {
  if (!hasWarnings(warnings)) {
    return (
      <p className="flex items-center gap-2">
        <CheckCircle2Icon className="size-4 text-blue" />
        {label}: {rubrics.length} rubric(s), keys match
      </p>
    );
  }

  return (
    <div className="max-h-32 overflow-y-scroll rounded-md border border-destructive/30 bg-destructive/10 p-3">
      <p className="flex items-center gap-2 font-medium text-destructive">
        <AlertTriangleIcon className="size-4" />
        {label}: keys don't match this form's weights
      </p>
      <ul className="mt-1 list-disc pl-6 text-destructive">
        {warnings.missingInRubric.map(({ role, scoreWeight }) => (
          <li key={`rubric-${role}-${scoreWeight}`}>
            {displayApplicantRoleNameNoEmoji(role)}: no question scores "
            {scoreWeight}"
          </li>
        ))}
        {warnings.missingInForm.map(({ role, scoreKey }) => (
          <li key={`form-${role}-${scoreKey}`}>
            {displayApplicantRoleNameNoEmoji(role)}: "{scoreKey}" isn't weighted
          </li>
        ))}
      </ul>
    </div>
  );
}

function WeightKeys({ label, weights }: { label: string; weights: Weights }) {
  const roles = (
    Object.entries(weights) as [ApplicantRole, Record<string, number>][]
  ).filter(([, w]) => Object.keys(w).length > 0);

  return (
    <div>
      <p className="font-medium text-black">{label}</p>
      {roles.length === 0 ? (
        <p className="text-muted-foreground">No weighted roles.</p>
      ) : (
        <ul className="list-disc pl-6 text-muted-foreground">
          {roles.map(([role, w]) => (
            <li key={role}>
              {displayApplicantRoleNameNoEmoji(role)}:{" "}
              {Object.keys(w).join(", ")}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
