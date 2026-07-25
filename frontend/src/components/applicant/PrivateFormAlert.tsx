import { ApplicationStatus } from "@app-portal/shared/constants";
import { Timestamp } from "firebase/firestore";
import { MailOpenIcon } from "lucide-react";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { ApplicationForm, ApplicationResponse } from "@/types/types";

/**
 * Alert card shown at the top of the apply page for users who have been
 * invited to a private form. Mirrors the apply/continue button behavior on
 * the main overview card, but scoped to this one form.
 */
export default function PrivateFormAlert({
  form,
  responses,
}: {
  form: ApplicationForm;
  responses: ApplicationResponse[];
}) {
  const navigate = useNavigate();
  const [wait, setWait] = useState(false);

  const inProgress = useMemo(
    () =>
      responses.some(
        (r) =>
          r.applicationFormId === form.id &&
          r.status === ApplicationStatus.InProgress,
      ),
    [responses, form.id],
  );

  const isPastDue = Timestamp.now() > form.dueDate;

  async function handleApply() {
    setWait(true);
    navigate(`/apply/f/${form.id}/${form.sections[0].sectionId}`);
    setWait(false);
  }

  return (
    <Card className="w-full max-w-5xl mb-5 gap-0 bg-blue/10 border border-blue py-4">
      <CardContent className="flex flex-col sm:flex-row sm:items-center gap-3 px-5">
        <MailOpenIcon
          className="size-5 text-blue shrink-0"
          aria-hidden="true"
        />
        <div className="flex-1">
          <p className="font-medium text-black">
            You&apos;ve been invited to a private application
          </p>
          <p className="text-sm text-gray-500">
            {form.semester} &middot; Due{" "}
            {form.dueDate.toDate().toLocaleString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
              hour: "numeric",
              minute: "2-digit",
              hour12: true,
              timeZoneName: "short",
            })}
          </p>
        </div>
        <Button
          onClick={handleApply}
          disabled={wait || isPastDue}
          className="w-full sm:w-fit cursor-pointer inline-flex items-center justify-center px-8 py-2 rounded-full bg-black
            text-white transition-colors hover:bg-darkgray"
        >
          {isPastDue
            ? "Application Closed"
            : inProgress
              ? "Continue Application"
              : "Apply"}
        </Button>
      </CardContent>
    </Card>
  );
}
