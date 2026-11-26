import type { ReactNode } from "react";
import { Children, createContext, useContext } from "react";

import { Button } from "@/components/ui/button";
import { DialogContent, DialogFooter } from "@/components/ui/dialog";

import type { WizardHook } from "./useWizard";

type WizardProps = {
  children: ReactNode[];
  wizard: WizardHook;
  onComplete: () => void;
};

const WizardContext = createContext<
  (WizardHook & { onComplete: () => void }) | null
>(null);

export function useWizardStep() {
  return useContext(WizardContext);
}

export function Wizard({ children, wizard, onComplete }: WizardProps) {
  const steps = Children.toArray(children);
  const active = steps[wizard.state.step];
  const isLast = wizard.isLast();

  return (
    <WizardContext.Provider value={{ ...wizard, onComplete }}>
      <DialogContent showCloseButton={false}>
        {active}
        <DialogFooter>
          <Button
            type="submit"
            disabled={!wizard.state.complete}
            onClick={isLast ? onComplete : wizard.next}
          >
            {!isLast ? "Next" : "Finish"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </WizardContext.Provider>
  );
}
