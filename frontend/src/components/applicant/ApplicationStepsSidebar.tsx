import { CheckIcon } from "lucide-react";

import { cn } from "@/lib/utils";

type Step = {
  id: string;
  label: string;
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
                onClick={() => onStepClick(step)}
                className={cn(
                  "group flex items-start gap-3 text-left",
                  isUpcoming ? "cursor-default" : "cursor-pointer",
                )}
              >
                <span
                  className={cn(
                    "relative z-10 flex size-7 shrink-0 items-center justify-center rounded-full border-2 text-xs font-semibold transition-colors",
                    isCompleted && "border-blue bg-blue text-white",
                    isActive && "border-blue bg-white text-blue",
                    isUpcoming && "border-gray-300 bg-white text-gray-400",
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
                    isUpcoming && "text-gray-400",
                  )}
                >
                  {step.label}
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
