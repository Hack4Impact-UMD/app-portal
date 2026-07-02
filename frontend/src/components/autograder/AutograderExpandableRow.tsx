import { ChevronDown } from "lucide-react";
import type { ReactNode } from "react";
import { useState } from "react";

import AutograderStatusIcon from "@/components/autograder/AutograderStatusIcon";
import type { AutograderStatusIconStatus } from "@/components/autograder/AutograderStatusIcon";
import { cn } from "@/lib/utils";

type AutograderExpandableRowProps = {
  status: AutograderStatusIconStatus;
  title: string;
  subtitle?: string;
  rightLabel?: string;
  children?: ReactNode;
  className?: string;
  contentClassName?: string;
};

export default function AutograderExpandableRow({
  status,
  title,
  subtitle,
  rightLabel,
  children,
  className,
  contentClassName,
}: AutograderExpandableRowProps) {
  const hasExpandableContent = Boolean(children);
  const shouldAutoOpen = hasExpandableContent && status === "failed";
  const [manualOpen, setManualOpen] = useState<boolean | null>(null);
  const isOpen = manualOpen ?? shouldAutoOpen;

  const rowContent = (
    <>
      <AutograderStatusIcon status={status} />
      <div className="min-w-0 flex-1">
        <p className="font-medium text-foreground">{title}</p>
        {subtitle && (
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        )}
      </div>
      {rightLabel && (
        <span className="shrink-0 text-xs font-medium text-muted-foreground">
          {rightLabel}
        </span>
      )}
    </>
  );

  if (!hasExpandableContent) {
    return (
      <div className={cn("flex items-center gap-3", className)}>
        {rowContent}
      </div>
    );
  }

  return (
    <div className={className}>
      <button
        className="group flex w-full cursor-pointer items-center gap-3 text-left"
        onClick={() => setManualOpen((open) => !(open ?? shouldAutoOpen))}
        type="button"
        aria-expanded={isOpen}
      >
        {rowContent}
        <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground transition-colors group-hover:bg-slate-200">
          <ChevronDown
            className={cn(
              "size-5 transition-transform",
              isOpen && "rotate-180",
            )}
          />
        </span>
      </button>

      {isOpen && <div className={cn("mt-3", contentClassName)}>{children}</div>}
    </div>
  );
}
