import type { ApplicantRole } from "@app-portal/shared/constants";
import { ReviewStatus } from "@app-portal/shared/constants";
import { useApplicationForm } from "@/hooks/useApplicationForm";
import { useMyApplicationStatus } from "@/hooks/useApplicationStatus";
import type { ApplicationResponse } from "@/types/types";
import type { Timestamp } from "firebase/firestore";
import { useMemo } from "react";
import { Link } from "react-router-dom";
import ApplicantRolePill from "../role-pill/RolePill";
import { statusDisplay } from "@/utils/status";
import Spinner from "../Spinner";

export function ApplicationResponseRow({
  response,
  role,
}: {
  response: ApplicationResponse;
  role: ApplicantRole;
}) {
  const {
    data: form,
    isPending: isFormPending,
    error: formError,
  } = useApplicationForm(response.applicationFormId);

  const {
    data: appStatus,
    isPending: isStatusPending,
    error: statusError,
  } = useMyApplicationStatus(response.id, role);

  const status = appStatus?.status;

  const decided = useMemo(
    () =>
      status === "decided" ||
      status === ReviewStatus.Accepted ||
      status === ReviewStatus.Waitlisted ||
      status === ReviewStatus.Denied,
    [status],
  );

  const formatDate = (timestamp: Timestamp) => {
    if (timestamp && timestamp.toDate) {
      return timestamp.toDate().toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    }
    return "-";
  };

  if (isFormPending || isStatusPending)
    return (
      <tr className="border-t border-gray-300">
        <td className="text-center py-4 px-2" colSpan={4}>
          <Spinner className="w-full" />
        </td>
      </tr>
    );

  if (formError)
    return (
      <tr className="border-t border-gray-300">
        <td className="text-center py-4 px-2" colSpan={4}>
          <p className="text-center">{formError.message}</p>
        </td>
      </tr>
    );

  if (statusError)
    return (
      <tr className="border-t border-gray-300">
        <td className="text-center py-4 px-2" colSpan={4}>
          <p className="text-center">{statusError.message}</p>
        </td>
      </tr>
    );

  const semesterDisplay = form.semester + " Application";

  return (
    <tr className="border-t border-gray-300">
      <td className="py-4 flex flex-row gap-2 items-center text-blue-500 font-bold">
        <Link
          className="text-blue-500 cursor-pointer"
          to={"/apply/revisit/" + response.applicationFormId}
        >
          {semesterDisplay.length > 25
            ? semesterDisplay.slice(0, 23) + "..."
            : semesterDisplay}
        </Link>
        <ApplicantRolePill role={role} maxLength={20} />
      </td>
      <td className="text-center">
        <span className={`px-3 py-1 rounded-full bg-lightblue`}>
          {decided ? "Decided" : status ? statusDisplay(status) : "Unknown"}
        </span>
      </td>
      <td className="text-center">{formatDate(response.dateSubmitted)}</td>
      <td className="text-center">
        {decided ? (
          form.decisionsReleased ? (
            <Link
              className="text-blue-500 cursor-pointer"
              to={"/apply/decision/" + response.id + "/" + role}
            >
              View Decision
            </Link>
          ) : (
            "Decisions not Released"
          )
        ) : (
          "-"
        )}
      </td>
    </tr>
  );
}
