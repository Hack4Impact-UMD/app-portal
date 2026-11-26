import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { useWizard } from "@/components/wizard/useWizard";
import { useWizardStep, Wizard } from "@/components/wizard/Wizard";
import { WizardStep } from "@/components/wizard/WizardStep";

type CreateFormWizardProps = {
  open: boolean;
  setOpen: (_: boolean) => void;
};

const Slide = () => {
  const wizard = useWizardStep();

  return <Button onClick={wizard?.complete}>Complete</Button>;
};

export function CreateFormWizard({ open, setOpen }: CreateFormWizardProps) {
  const wizard = useWizard(3);

  return (
    <Dialog open={open}>
      <Wizard onComplete={() => setOpen(false)} wizard={wizard}>
        <WizardStep title="Create Form">
          <Slide />
        </WizardStep>
        <WizardStep title="Create Rubrics">
          <Slide />
        </WizardStep>
        <WizardStep title="Checklist">
          <Slide />
        </WizardStep>
      </Wizard>
    </Dialog>
  );
}
