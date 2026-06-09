import { useMemo, useState } from "react";
import { useParams } from "react-router-dom";

import { ReviewerAssignmentsTable } from "@/components/dor/ReviewerAssignmentsDashboard";
import Loading from "@/components/Loading";
import ApplicantRolePill from "@/components/role-pill/RolePill";
import { Button } from "@/components/ui/button";
import { useReviewAssignments } from "@/hooks/useReviewAssignments";
import { useReviewDataForReviewer } from "@/hooks/useReviewData";
import { useReviewerForId } from "@/hooks/useReviewers";
import { reviewingFor } from "@/services/reviewersService";

export function ReviewerAssignmentsPage() {
  const [statusFilter, setStatusFilter] = useState<
    "reviewed" | "pending" | "all"
  >("all");
  const { formId, reviewerId } = useParams<{
    formId: string;
    reviewerId: string;
  }>();

  const {
    data: assignedApps,
    isPending: assignmentsPending,
    error: assignmentsError,
  } = useReviewAssignments(formId, reviewerId);
  const {
    data: reviewer,
    isPending: applicantPending,
    error: reviewerError,
  } = useReviewerForId(reviewerId);
  const {
    data: reviews,
    isPending: reviewsPending,
    error: reviewsError,
  } = useReviewDataForReviewer(formId, reviewerId);

  const numReviewed = useMemo(
    () =>
      reviews?.reduce((acc, review) => (review.submitted ? acc + 1 : acc), 0) ??
      0,
    [reviews],
  );

  if (assignmentsPending || applicantPending || reviewsPending)
    return <Loading />;

  if (assignmentsError)
    return <p>Failed to fetch assignments: {assignmentsError.message}</p>;
  if (reviewerError)
    return <p>Failed to fetch applicant: {reviewerError.message}</p>;
  if (reviewsError)
    return <p>Failed to fetch reviews: {reviewsError.message}</p>;
  if (!reviewer) return <p>Failed to fetch reviewer</p>;

  return (
    <div className="w-full h-full bg-lightgray flex flex-col items-center p-2 py-4">
      <div className="max-w-5xl w-full rounded bg-white p-4 flex flex-col gap-2">
        <div className="flex flex-row items-start pb-4 border-b">
          <span className="text-center w-full font-bold text-muted-foreground">
            You are viewing all assigned applications for reviewer{" "}
            {reviewer.firstName}
            {reviewer.lastName}
          </span>
        </div>
        <div className="flex flex-row items-start justify-start mt-2 gap-24">
          <div className="min-w-64">
            <p className="text-muted-foreground mb-2">REVIEWER NAME</p>
            <h1 className="text-2xl font-bold">
              {reviewer.firstName} {reviewer.lastName}
            </h1>
          </div>
          <div>
            <p className="text-muted-foreground mb-3">ROLES ASSIGNED</p>
            <div className="flex flex-wrap gap-1">
              {reviewingFor(reviewer).map((role, i) => (
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
					${statusFilter !== "reviewed" ? "bg-[#DCEBDD] hover:bg-[#DCEBDD]/90 text-[#1D3829]" : "bg-[#1D3829] hover:bg-[#1D3829]/90 text-[#DCEBDD]"}`}
            onClick={() => setStatusFilter("reviewed")}
          >
            <span className="text-3xl">{numReviewed}</span>
            <span className="mt-auto">Reviewed</span>
          </Button>
          <Button
            className={`h-28 min-w-40 p-4 flex flex-col items-start 
					${statusFilter !== "pending" ? "bg-[#FBDED9] hover:bg-[#FBDED9]/90 text-[#5D1615]" : "bg-[#5D1615] hover:bg-[#5D1615]/90 text-[#FBDED9]"}`}
            onClick={() => setStatusFilter("pending")}
          >
            <span className="text-3xl">
              {assignedApps.length - (numReviewed ?? 0)}
            </span>
            <span className="mt-auto">Pending</span>
          </Button>
        </div>
        <ReviewerAssignmentsTable
          assignments={assignedApps}
          formId={formId!}
          search=""
          statusFilter={statusFilter}
        />
      </div>
    </div>
  );
}
