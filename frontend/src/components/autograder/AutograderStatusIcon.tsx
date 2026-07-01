import { CheckCircle2, Circle, LoaderCircle, XCircle } from "lucide-react";

export type AutograderStatusIconStatus =
  | "complete"
  | "active"
  | "failed"
  | "pending";

type AutograderStatusIconProps = {
  status: AutograderStatusIconStatus;
  className?: string;
};

export default function AutograderStatusIcon({
  status,
  className = "size-5",
}: AutograderStatusIconProps) {
  if (status === "complete") {
    return <CheckCircle2 className={`${className} text-green-700`} />;
  }

  if (status === "active") {
    return <LoaderCircle className={`${className} animate-spin text-blue`} />;
  }

  if (status === "failed") {
    return <XCircle className={`${className} text-destructive`} />;
  }

  return <Circle className={`${className} text-muted-foreground`} />;
}
