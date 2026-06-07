import { useMemo, useState } from "react";
import { useParams } from "react-router-dom";

import { AssignedInterviewsTable } from "@/components/dor/AssignedInterviewsDashboard";
import Loading from "@/components/Loading";
import ApplicantRolePill from "@/components/role-pill/RolePill";
import { Button } from "@/components/ui/button";
import { useApplicantForResponse } from "@/hooks/useApplicants";
import { useApplicationResponse } from "@/hooks/useApplicationResponses";
import { useInterviewAssignmentsForResponse } from "@/hooks/useInterviewAssignments";
import { useInterviewDataForResponse } from "@/hooks/useInterviewData";

export function AssignedInterviewsPage() {
  const [statusFilter, setStatusFilter] = useState<
    "interviewed" | "pending" | "all"
  >("all");
  const { responseId } = useParams<{ responseId: string }>();
  const {
    data: assignedApps,
    isPending: assignmentsPending,
    error: assignmentsError,
  } = useInterviewAssignmentsForResponse(responseId!);
  const {
    data: applicant,
    isPending: applicantPending,
    error: applicantError,
  } = useApplicantForResponse(responseId!);
  const {
    data: response,
    isPending: responsePending,
    error: responseError,
  } = useApplicationResponse(responseId!);
  const {
    data: interviews,
    isPending: interviewsPending,
    error: interviewsError,
  } = useInterviewDataForResponse(responseId!);

  const numInterviewed = useMemo(
    () =>
      interviews?.reduce(
        (acc, interview) => (interview.submitted ? acc + 1 : acc),
        0,
      ) ?? 0,
    [interviews],
  );

  if (
    assignmentsPending ||
    applicantPending ||
    responsePending ||
    interviewsPending
  )
    return <Loading />;

  if (assignmentsError)
    return <p>Failed to fetch assignments: {assignmentsError.message}</p>;
  if (applicantError)
    return <p>Failed to fetch applicant: {applicantError.message}</p>;
  if (responseError)
    return <p>Failed to fetch response: {responseError.message}</p>;
  if (interviewsError)
    return <p>Failed to fetch interviews: {interviewsError.message}</p>;
  if (!response) return <p>Failed to fetch interviews</p>;

  return (
    <div className="w-full h-full bg-lightgray flex flex-col items-center p-2 py-4">
      <div className="max-w-5xl w-full rounded bg-white p-4 flex flex-col gap-2">
        <div className="flex flex-row items-start pb-4 border-b">
          <span className="text-center w-full font-bold text-muted-foreground">
            You are viewing all assigned interviews for {applicant.firstName}{" "}
            {applicant.lastName}'s application
          </span>
        </div>
        <div className="flex flex-row items-start justify-start mt-2 gap-24">
          <div className="min-w-64">
            <p className="text-muted-foreground mb-2">APPLICANT NAME</p>
            <h1 className="text-2xl font-bold">
              {applicant.firstName} {applicant.lastName}
            </h1>
          </div>
          <div>
            <p className="text-muted-foreground mb-3">ROLES APPLIED</p>
            <div className="flex flex-wrap gap-1">
              {response.rolesApplied.map((role, i) => (
                <ApplicantRolePill key={i} role={role} />
              ))}
            </div>
          </div>
        </div>
        <div className="flex flex-row gap-2 items-center min-h-28 justify-stretch mt-8">
          <Button
            className={`h-28 min-w-40 text-white p-4 flex flex-col items-start 
					${statusFilter === "all" ? "bg-[#17476B] hover:bg-[#17476B]/90 text-[#D5E7F2]" : "bg-[#D5E7F2] hover:bg-[#D5E7F2]/90 text-[#17476B]"}`}
            onClick={() => setStatusFilter("all")}
          >
            <span className="text-3xl">{assignedApps.length}</span>
            <span className="mt-auto">Total Assignments</span>
          </Button>
          <Button
            className={`h-28 min-w-40 p-4 flex flex-col items-start 
					${statusFilter !== "interviewed" ? "bg-[#DCEBDD] hover:bg-[#DCEBDD]/90 text-[#1D3829]" : "bg-[#1D3829] hover:bg-[#1D3829]/90 text-[#DCEBDD]"}`}
            onClick={() => setStatusFilter("interviewed")}
          >
            <span className="text-3xl">{numInterviewed}</span>
            <span className="mt-auto">Interviewed</span>
          </Button>
          <Button
            className={`h-28 min-w-40 p-4 flex flex-col items-start 
					${statusFilter !== "pending" ? "bg-[#FBDED9] hover:bg-[#FBDED9]/90 text-[#5D1615]" : "bg-[#5D1615] hover:bg-[#5D1615]/90 text-[#FBDED9]"}`}
            onClick={() => setStatusFilter("pending")}
          >
            <span className="text-3xl">
              {assignedApps.length - (numInterviewed ?? 0)}
            </span>
            <span className="mt-auto">Pending</span>
          </Button>
        </div>
        <AssignedInterviewsTable
          assignments={assignedApps}
          formId={response.applicationFormId}
          search=""
          statusFilter={statusFilter}
        />
      </div>
    </div>
  );
}
