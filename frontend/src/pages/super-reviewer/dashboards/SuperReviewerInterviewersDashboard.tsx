import { useParams } from "react-router-dom";
import Loading from "../../../components/Loading";
import useSearch from "@/hooks/useSearch";
import { Button } from "@/components/ui/button";
import { useMemo, useState } from "react";
import { useAllReviewers } from "@/hooks/useReviewers";
import { useInterviewDataForForm } from "@/hooks/useInterviewData";
import { useInterviewAssignmentsForForm } from "@/hooks/useInterviewAssignments";
import { InterviewersTable } from "@/components/dor/InterviewersDashboard";

export default function SuperReviewerInterviewersDashboard() {
  const { formId } = useParams<{ formId: string }>();

  const {
    data: interviewers,
    isPending: interviewersPending,
    error: interviewersError,
  } = useAllReviewers(); // all reviewers are eligible for interviews, but some will never be assigned interviews
  const {
    data: interviewData,
    isPending: dataPending,
    error: dataError,
  } = useInterviewDataForForm(formId!);
  const {
    data: assignments,
    isPending: assignmentsPending,
    error: assignmentsError,
  } = useInterviewAssignmentsForForm(formId!);

  const { search } = useSearch();

  const [statusFilter, setStatusFilter] = useState<
    "all" | "complete" | "pending" | "unassigned"
  >("all");

  const numComplete = useMemo(
    () =>
      interviewers?.reduce((acc, interviewer) => {
        const data =
          interviewData?.filter((d) => d.interviewerId === interviewer.id) ??
          [];
        const assigned =
          assignments?.filter((a) => a.interviewerId === interviewer.id) ?? [];

        if (data.length === 0 && assigned.length === 0) return acc;

        if (
          data.reduce(
            (acc, interview) => (interview.submitted ? acc + 1 : acc),
            0,
          ) === assigned.length
        ) {
          return acc + 1;
        } else {
          return acc;
        }
      }, 0),
    [assignments, interviewData, interviewers],
  );

  const numNoAssignments = useMemo(
    () =>
      interviewers?.reduce((acc, interviewer) => {
        const data =
          interviewData?.filter((d) => d.interviewerId === interviewer.id) ??
          [];
        const assigned =
          assignments?.filter((a) => a.interviewerId === interviewer.id) ?? [];

        if (data.length === 0 && assigned.length === 0) return acc + 1;
        else return acc;
      }, 0),
    [assignments, interviewData, interviewers],
  );

  if (!formId) return <p>No formId found! The url is probably malformed.</p>;
  if (interviewersError)
    return <p>Failed to fetch interviewers: {interviewersError.message}</p>;
  if (dataError)
    return <p>Failed to fetch interview data: {dataError.message}</p>;
  if (assignmentsError)
    return (
      <p>Failed to fetch interview assignments: {assignmentsError.message}</p>
    );
  if (interviewersPending || dataPending || assignmentsPending || !interviewers)
    return <Loading />;

  return (
    <div>
      <div className="overflow-x-scroll flex flex-row gap-2 justify-stretch mt-4 no-scrollbar">
        <Button
          className={`h-28 min-w-40 text-white p-4 flex flex-col items-start 
					${statusFilter === "all" ? "bg-[#17476B] hover:bg-[#17476B]/90 text-[#D5E7F2]" : "bg-[#D5E7F2] hover:bg-[#D5E7F2]/90 text-[#17476B]"}`}
          onClick={() => setStatusFilter("all")}
        >
          <span className="text-3xl">{interviewers.length}</span>
          <span className="mt-auto">Interviewers</span>
        </Button>
        <Button
          className={`h-28  min-w-40 p-4 flex flex-col items-start 
					${statusFilter !== "complete" ? "bg-[#DCEBDD] hover:bg-[#DCEBDD]/90 text-[#1D3829]" : "bg-[#1D3829] hover:bg-[#1D3829]/90 text-[#DCEBDD]"}`}
          onClick={() => setStatusFilter("complete")}
        >
          <span className="text-3xl">{numComplete}</span>
          <span className="mt-auto">Completed</span>
        </Button>
        <Button
          className={`h-28 min-w-40 p-4 flex flex-col items-start 
					${statusFilter !== "pending" ? "bg-[#FBDED9] hover:bg-[#FBDED9]/90 text-[#5D1615]" : "bg-[#5D1615] hover:bg-[#5D1615]/90 text-[#FBDED9]"}`}
          onClick={() => setStatusFilter("pending")}
        >
          <span className="text-3xl">
            {interviewers.length - (numComplete ?? 0) - (numNoAssignments ?? 0)}
          </span>
          <span className="mt-auto">Pending</span>
        </Button>
        <Button
          className={`h-28 min-w-40 p-4 flex flex-col items-start 
					${statusFilter !== "unassigned" ? "bg-[#F8E6BA] hover:bg-[#F8E6BA]/90 text-[#402C1B]" : "bg-[#402C1B] hover:bg-[#402C1B]/90 text-[#F8E6BA]"}`}
          onClick={() => setStatusFilter("unassigned")}
        >
          <span className="text-3xl">{numNoAssignments}</span>
          <span className="mt-auto">No Assignments</span>
        </Button>
      </div>
      <InterviewersTable
        interviewers={interviewers}
        interviewData={interviewData}
        assignments={assignments}
        formId={formId}
        search={search}
        statusFilter={statusFilter}
      />
    </div>
  );
}
