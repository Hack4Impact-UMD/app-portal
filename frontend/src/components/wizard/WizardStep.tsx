import type { ReactNode } from "react";

import {
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { useWizardStep } from "./Wizard";

export function WizardStep({
  children,
  title,
}: {
  title: string;
  children: ReactNode;
}) {
  const wizard = useWizardStep();

  return (
    <>
      <DialogHeader>
        <DialogTitle>{title}</DialogTitle>
        <DialogDescription>
          Step {(wizard?.state.step ?? 0) + 1}/{wizard?.steps ?? 0}
        </DialogDescription>
      </DialogHeader>
      {children}
    </>
  );
}
