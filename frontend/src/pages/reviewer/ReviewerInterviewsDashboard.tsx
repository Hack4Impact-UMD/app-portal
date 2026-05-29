import { useMemo, useState } from "react";
import { useParams } from "react-router-dom";

import { ReviewerInterviewsTable } from "@/components/reviewer/ReviewerInterviewsTable";
import Spinner from "@/components/Spinner";
import { Button } from "@/components/ui/button";
import { useMyInterviewAssignments } from "@/hooks/useInterviewAssignments";
import { useMyInterviews } from "@/hooks/useInterviewData";
import useSearch from "@/hooks/useSearch";

export default function ReviewerInterviewsDashboard() {
  const { formId } = useParams();
  const {
    data: assignedInterviews,
    isPending: assignmentsLoading,
    error: assignmentsError,
  } = useMyInterviewAssignments(formId ?? "");
  const {
    data: interviews,
    isPending: interviewsLoading,
    error: interviewsError,
  } = useMyInterviews(formId ?? "");
  const { search } = useSearch();
  const [statusFilter, setStatusFilter] = useState<
    "all" | "completed" | "pending"
  >("all");

  const numReviewed = useMemo(
    () =>
      assignedInterviews?.filter((f) =>
        interviews
          ?.filter((r) => r.submitted && r.forRole === f.forRole)
          ?.map((r) => r.applicationResponseId)
          .includes(f.applicationResponseId),
      ).length,
    [interviews, assignedInterviews],
  );

  if (!formId) return <p>Form ID not provided!</p>;

  if (assignmentsLoading || interviewsLoading)
    return (
      <div className="flex items-center justify-center p-4 w-full h-full">
        <Spinner />
      </div>
    );
  if (assignmentsError)
    return (
      <p>Failed to fetch assigned interviews: {assignmentsError.message}</p>
    );
  if (interviewsError)
    return <p>Failed to fetch interview data: {interviewsError.message}</p>;

  return (
    <div className="max-w-5xl w-full rounded bg-white flex flex-col gap-2">
      <div className="flex flex-row gap-2 items-center min-h-28 justify-stretch mt-4">
        <Button
          className={`h-28 min-w-40 text-white p-4 flex flex-col items-start 
					${statusFilter === "all" ? "bg-[#17476B] hover:bg-[#17476B]/90 text-[#D5E7F2]" : "bg-[#D5E7F2] hover:bg-[#D5E7F2]/90 text-[#17476B]"}`}
          onClick={() => setStatusFilter("all")}
        >
          <span className="text-3xl">{assignedInterviews.length}</span>
          <span className="mt-auto">Interviews</span>
        </Button>
        <Button
          className={`h-28 min-w-40 p-4 flex flex-col items-start 
					${statusFilter !== "completed" ? "bg-[#DCEBDD] hover:bg-[#DCEBDD]/90 text-[#1D3829]" : "bg-[#1D3829] hover:bg-[#1D3829]/90 text-[#DCEBDD]"}`}
          onClick={() => setStatusFilter("completed")}
        >
          <span className="text-3xl">{numReviewed}</span>
          <span className="mt-auto">Completed</span>
        </Button>
        <Button
          className={`h-28 min-w-40 p-4 flex flex-col items-start 
					${statusFilter !== "pending" ? "bg-[#FBDED9] hover:bg-[#FBDED9]/90 text-[#5D1615]" : "bg-[#5D1615] hover:bg-[#5D1615]/90 text-[#FBDED9]"}`}
          onClick={() => setStatusFilter("pending")}
        >
          <span className="text-3xl">
            {assignedInterviews.length - (numReviewed ?? 0)}
          </span>
          <span className="mt-auto">Pending</span>
        </Button>
      </div>
      <ReviewerInterviewsTable
        formId={formId}
        statusFilter={statusFilter}
        search={search}
        assignments={assignedInterviews}
      />
    </div>
  );
}
