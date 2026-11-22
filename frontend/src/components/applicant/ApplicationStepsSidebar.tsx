import { CheckIcon } from "lucide-react";

import { cn } from "@/lib/utils";

type Step = {
  id: string;
  label: string;
  edited?: boolean;
};

type ApplicationStepsSidebarProps = {
  steps: Step[];
  currentStep: number;
  onStepClick: (step: Step) => void;
  className?: string;
};

export default function ApplicationStepsSidebar({
  steps,
  currentStep,
  onStepClick,
  className,
}: ApplicationStepsSidebarProps) {
  const current = steps[currentStep];

  const lastEditedIndex = steps.reduce(
    (last, s, i) => (s.edited ? i : last),
    -1,
  );
  const furthestClickable = Math.max(currentStep, lastEditedIndex);

  return (
    <nav aria-label="Application steps" className={className}>
      {/* Mobile: compact progress line */}
      <p className="md:hidden text-sm text-gray-500">
        Step {currentStep + 1} of {steps.length}
        {current && (
          <>
            {" "}
            &middot;{" "}
            <span className="font-medium text-black">{current.label}</span>
          </>
        )}
      </p>

      {/* Desktop: full step list */}
      <ol className="hidden md:flex flex-col">
        {steps.map((step, index) => {
          const isCompleted = index < currentStep;
          const isActive = index === currentStep;
          const isUpcoming = index > currentStep;
          const isLast = index === steps.length - 1;
          const isClickable = index <= furthestClickable;
          const isUnlocked = isUpcoming && isClickable;
          const isLocked = !isClickable;

          return (
            <li key={step.id} className="relative flex gap-3 pb-6 last:pb-0">
              {!isLast && (
                <span
                  aria-hidden="true"
                  className={cn(
                    "absolute left-[13px] top-7 bottom-1 w-0.5",
                    isCompleted ? "bg-blue" : "bg-gray-200",
                  )}
                />
              )}
              <button
                type="button"
                aria-current={isActive ? "step" : undefined}
                disabled={!isClickable}
                title={isLocked ? "Complete earlier sections to unlock" : undefined}
                onClick={() => {
                  if (isClickable) onStepClick(step);
                }}
                className={cn(
                  "group flex items-start gap-3 text-left",
                  isClickable ? "cursor-pointer" : "cursor-default",
                )}
              >
                <span
                  className={cn(
                    "relative z-10 flex size-7 shrink-0 items-center justify-center rounded-full border-2 text-xs font-semibold transition-colors",
                    isCompleted && "border-blue bg-blue text-white",
                    isActive && "border-blue bg-white text-blue",
                    isUnlocked &&
                    "border-blue/50 bg-white text-blue group-hover:border-blue group-hover:bg-blue/10",
                    isLocked && "border-gray-200 bg-gray-50 text-gray-400",
                  )}
                >
                  {isCompleted ? (
                    <CheckIcon className="size-4" aria-hidden="true" />
                  ) : (
                    index + 1
                  )}
                </span>
                <span
                  className={cn(
                    "pt-1 text-base leading-tight",
                    isCompleted && "text-gray-700 group-hover:underline",
                    isActive && "font-semibold text-black",
                    isUnlocked && "text-gray-700 group-hover:underline",
                    isLocked && "text-gray-400",
                  )}
                >
                  {step.label}
                  {isLocked && <span className="sr-only"> (locked)</span>}
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
