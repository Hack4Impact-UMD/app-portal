import InterviewerAssignmentsTable from "@/components/dor/InterviewerAssignmentsDashboard/InterviewerAssignmentsTable";
import Loading from "@/components/Loading";
import ApplicantRolePill from "@/components/role-pill/RolePill";
import { Button } from "@/components/ui/button";
import { useInterviewAssignments } from "@/hooks/useInterviewAssignments";
import { useInterviewDataForInterviewer } from "@/hooks/useInterviewData";
import { getReviewerById, reviewingFor } from "@/services/reviewersService";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { useParams } from "react-router-dom";

function useInterviewerForId(interviewerId: string) {
  return useQuery({
    queryKey: ["interviewer", "interviewer", interviewerId],
    enabled: !!interviewerId,
    queryFn: async () => {
      const user = await getReviewerById(interviewerId);
      return user;
    },
  });
}

export function InterviewerAssignmentsPage() {
  const [statusFilter, setStatusFilter] = useState<
    "reviewed" | "pending" | "all"
  >("all");
  const { formId, interviewerId } = useParams<{
    formId: string;
    interviewerId: string;
  }>();

  const {
    data: assignedInterviews,
    isPending: assignmentsPending,
    error: assignmentsError,
  } = useInterviewAssignments(formId!, interviewerId!);
  const {
    data: interviewer,
    isPending: interviewerPending,
    error: interviewerError,
  } = useInterviewerForId(interviewerId!);
  const {
    data: interviews,
    isPending: interviewsPending,
    error: interviewsError,
  } = useInterviewDataForInterviewer(formId!, interviewerId!);

  const numInterviewed = useMemo(
    () =>
      interviews?.reduce(
        (acc, interview) => (interview.submitted ? acc + 1 : acc),
        0,
      ) ?? 0,
    [interviews],
  );

  if (assignmentsPending || interviewerPending || interviewsPending)
    return <Loading />;

  if (assignmentsError)
    return <p>Failed to fetch assignments: {assignmentsError.message}</p>;
  if (interviewerError)
    return <p>Failed to fetch interviewer: {interviewerError.message}</p>;
  if (interviewsError)
    return <p>Failed to fetch interviews: {interviewsError.message}</p>;
  if (!interviewer) return <p>Failed to fetch interviewer</p>;

  return (
    <div className="w-full h-full bg-lightgray flex flex-col items-center p-2 py-4">
      <div className="max-w-5xl w-full rounded bg-white p-4 flex flex-col gap-2">
        <div className="flex flex-row items-start pb-4 border-b">
          <span className="text-center w-full font-bold text-muted-foreground">
            You are viewing all assigned applications for interviewer{" "}
            {interviewer.firstName}
            {interviewer.lastName}
          </span>
        </div>
        <div className="flex flex-row items-start justify-start mt-2 gap-24">
          <div className="min-w-64">
            <p className="text-muted-foreground mb-2">INTERVIEWER NAME</p>
            <h1 className="text-2xl font-bold">
              {interviewer.firstName} {interviewer.lastName}
            </h1>
          </div>
          <div>
            <p className="text-muted-foreground mb-3">ROLES ASSIGNED</p>
            <div className="flex flex-wrap gap-1">
              {reviewingFor(interviewer).map((role, i) => (
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
            <span className="text-3xl">{assignedInterviews.length}</span>
            <span className="mt-auto">Total Assignments</span>
          </Button>
          <Button
            className={`h-28 min-w-40 p-4 flex flex-col items-start 
                    ${statusFilter !== "reviewed" ? "bg-[#DCEBDD] hover:bg-[#DCEBDD]/90 text-[#1D3829]" : "bg-[#1D3829] hover:bg-[#1D3829]/90 text-[#DCEBDD]"}`}
            onClick={() => setStatusFilter("reviewed")}
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
              {assignedInterviews.length - (numInterviewed ?? 0)}
            </span>
            <span className="mt-auto">Pending</span>
          </Button>
        </div>
        <InterviewerAssignmentsTable
          assignments={assignedInterviews}
          formId={formId!}
          search=""
          statusFilter={statusFilter}
        />
      </div>
    </div>
  );
}
