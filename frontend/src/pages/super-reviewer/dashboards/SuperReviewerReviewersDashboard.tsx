import { useParams } from "react-router-dom";
import Loading from "../../../components/Loading";
import ReviewersTable from "../../../components/dor/ReviewersDashboard/ReviewersTable";
import useSearch from "@/hooks/useSearch";
import { useAllReviewers } from "@/hooks/useReviewers";
import { useReviewDataForForm } from "@/hooks/useReviewData";
import { Button } from "@/components/ui/button";
import { useMemo, useState } from "react";
import { useReviewAssignmentsForForm } from "@/hooks/useReviewAssignments";

export default function SuperReviewerReviewersDashboard() {
  const { formId } = useParams<{ formId: string }>();

  const {
    data: reviewers,
    isPending: reviewersPending,
    error: reviewersError,
  } = useAllReviewers();

  const {
    data: reviewData,
    isPending: dataPending,
    error: dataError,
  } = useReviewDataForForm(formId!);
  const {
    data: assignments,
    isPending: assignmentsPending,
    error: assignmentsError,
  } = useReviewAssignmentsForForm(formId!);

  const { search } = useSearch();

  const [statusFilter, setStatusFilter] = useState<
    "all" | "complete" | "pending" | "unassigned"
  >("all");

  const numComplete = useMemo(
    () =>
      reviewers?.reduce((acc, reviewer) => {
        const data =
          reviewData?.filter((d) => d.reviewerId === reviewer.id) ?? [];
        const assigned =
          assignments?.filter((a) => a.reviewerId === reviewer.id) ?? [];

        if (data.length === 0 && assigned.length === 0) return acc;

        if (
          data.reduce(
            (acc, review) => (review.submitted ? acc + 1 : acc),
            0,
          ) === assigned.length
        ) {
          return acc + 1;
        } else {
          return acc;
        }
      }, 0),
    [assignments, reviewData, reviewers],
  );

  const numNoAssignments = useMemo(
    () =>
      reviewers?.reduce((acc, reviewer) => {
        const data =
          reviewData?.filter((d) => d.reviewerId === reviewer.id) ?? [];
        const assigned =
          assignments?.filter((a) => a.reviewerId === reviewer.id) ?? [];

        if (data.length === 0 && assigned.length === 0) return acc + 1;
        else return acc;
      }, 0),
    [assignments, reviewData, reviewers],
  );

  if (!formId) return <p>No formId found! The url is probably malformed.</p>;
  if (reviewersError)
    return <p>Failed to fetch reviewers: {reviewersError.message}</p>;
  if (dataError) return <p>Failed to fetch review data: {dataError.message}</p>;
  if (assignmentsError)
    return (
      <p>Failed to fetch review assignments: {assignmentsError.message}</p>
    );
  if (reviewersPending || dataPending || assignmentsPending || !reviewers)
    return <Loading />;

  return (
    <div>
      <div className="overflow-x-scroll flex flex-row gap-2 justify-stretch mt-4 no-scrollbar">
        <Button
          className={`h-28 min-w-40 text-white p-4 flex flex-col items-start 
					${statusFilter === "all" ? "bg-[#17476B] hover:bg-[#17476B]/90 text-[#D5E7F2]" : "bg-[#D5E7F2] hover:bg-[#D5E7F2]/90 text-[#17476B]"}`}
          onClick={() => setStatusFilter("all")}
        >
          <span className="text-3xl">{reviewers.length}</span>
          <span className="mt-auto">Reviewers</span>
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
            {reviewers.length - (numComplete ?? 0) - (numNoAssignments ?? 0)}
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
      <ReviewersTable
        reviewers={reviewers}
        assignments={assignments}
        reviewData={reviewData}
        formId={formId}
        search={search}
        statusFilter={statusFilter}
      />
    </div>
  );
}
