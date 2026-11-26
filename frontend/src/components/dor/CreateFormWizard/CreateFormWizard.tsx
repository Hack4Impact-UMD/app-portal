import { useState } from "react";

import { Dialog } from "@/components/ui/dialog";
import { useWizard } from "@/components/wizard/useWizard";
import { Wizard } from "@/components/wizard/Wizard";
import { WizardStep } from "@/components/wizard/WizardStep";

import { FormStep } from "./FormStep";
import { RemindersStep } from "./RemindersStep";
import { RubricStep } from "./RubricStep";

type CreateFormWizardProps = {
  open: boolean;
  setOpen: (_: boolean) => void;
};

export function CreateFormWizard({ open, setOpen }: CreateFormWizardProps) {
  const wizard = useWizard(3);
  const [formId, setFormId] = useState<string>();

  const handleOpenChange = (next: boolean) => {
    if (
      (wizard.state.step === 0 && !wizard.state.complete) ||
      (wizard.isLast() && wizard.state.complete)
    ) {
      if (!next) {
        wizard.reset();
        setFormId(undefined);
      }
      setOpen(next);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <Wizard onComplete={() => handleOpenChange(false)} wizard={wizard}>
        <WizardStep title="Create Form">
          <FormStep onCreated={setFormId} />
        </WizardStep>
        <WizardStep title="Create Rubrics">
          {formId && <RubricStep formId={formId} />}
        </WizardStep>
        <WizardStep title="Checklist">
          <RemindersStep />
        </WizardStep>
      </Wizard>
    </Dialog>
  );
}
