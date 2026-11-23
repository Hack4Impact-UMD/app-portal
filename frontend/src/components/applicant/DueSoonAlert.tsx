import type { TimestampLike } from "@app-portal/shared/types";
import { TriangleAlertIcon } from "lucide-react";
import { useEffect, useState } from "react";

// 3 days
const DUE_SOON_WINDOW_MS = 3 * 24 * 60 * 60 * 1000;

export default function DueSoonAlert({ dueDate }: { dueDate: TimestampLike }) {
  const due = dueDate.toDate();

  const shouldShow = () => {
    const msUntilDue = due.getTime() - Date.now();
    return msUntilDue > 0 && msUntilDue <= DUE_SOON_WINDOW_MS;
  };

  const [show, setShow] = useState(shouldShow());

  useEffect(() => {
    const timer = setInterval(() => {
      setShow(shouldShow());
    }, 1000 * 60);

    return () => {
      clearInterval(timer);
    };
  });

  if (!show) return null;

  return (
    <div
      role="alert"
      className="flex w-full max-w-3xl items-start gap-3 rounded-xl border border-amber-300 bg-amber-50 p-4 text-amber-900"
    >
      <TriangleAlertIcon
        className="mt-1 size-5 shrink-0 text-amber-600"
        aria-hidden="true"
      />
      <div className="text-sm">
        <p className="font-bold text-lg">
          This application is due{" "}
          {due.toLocaleString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
            hour: "numeric",
            minute: "2-digit",
            hour12: true,
            timeZoneName: "short",
          })}
          .
        </p>
        <p>
          You must submit all parts of your application before the due date to
          be considered. Your progress is saved, but it will{" "}
          <strong>not</strong> be submitted automatically when the due date
          arrives.
        </p>
      </div>
    </div>
  );
}
