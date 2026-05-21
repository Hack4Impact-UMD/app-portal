import type { ApplicantRole } from "@app-portal/shared/types";
import type {
  ApplicationInterviewData,
  InterviewAssignment,
} from "@/types/types";
import type { ColumnDef } from "@tanstack/react-table";
import {
  createColumnHelper,
  getPaginationRowModel,
} from "@tanstack/react-table";
import { useCallback, useMemo, useState } from "react";
import { DataTable } from "@/components/DataTable";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import ApplicantRolePill from "@/components/role-pill/RolePill";
import type { InterviewAssignmentRow } from "./useRows";
import { useRows } from "./useRows";
import { createInterviewData } from "@/services/interviewDataService";
import SortableHeader from "@/components/tables/SortableHeader";
import { useNavigate } from "react-router-dom";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { UserCheckIcon } from "lucide-react";

type ReviewerApplicationsTableProps = {
  assignments: InterviewAssignment[];
  search: string;
  rowCount?: number;
  statusFilter: "all" | "completed" | "pending";
  formId: string;
};

export default function ReviewerInterviewsTable({
  assignments,
  search,
  formId,
  rowCount = 20,
  statusFilter = "all",
}: ReviewerApplicationsTableProps) {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: rowCount,
  });

  const handleInterview = useCallback(
    async (
      appInterviewData: ApplicationInterviewData | undefined,
      applicantId: string,
      responseId: string,
      role: ApplicantRole,
    ) => {
      if (appInterviewData) {
        // there's an existing interview, edit it
        navigate(
          `/admin/interview/f/${appInterviewData.applicationFormId}/${responseId}/${appInterviewData.id}`,
        );
      } else {
        const interview: Omit<ApplicationInterviewData, "id"> = {
          interviewScores: {},
          applicantId: applicantId,
          applicationFormId: formId,
          applicationResponseId: responseId,
          forRole: role,
          interviewerId: user!.id,
          interviewerNotes: {},
          submitted: false,
        };

        const newinterview = await createInterviewData(interview);
        navigate(
          `/admin/interview/f/${newinterview.applicationFormId}/${responseId}/${newinterview.id}`,
        );
      }
    },
    [formId, navigate, user],
  );

  const columnHelper = createColumnHelper<InterviewAssignmentRow>();
  const cols = useMemo(
    () =>
      [
        columnHelper.accessor("index", {
          id: "number",
          header: ({ column }) => {
            return <SortableHeader column={column}>S. NO</SortableHeader>;
          },
          cell: ({ getValue }) => getValue(),
        }),
        columnHelper.accessor("applicantName", {
          id: "applicant-name",
          header: ({ column }) => {
            return <SortableHeader column={column}>APPLICANT</SortableHeader>;
          },
          cell: ({ getValue, row }) => {
            const internal = row.original.applicant.isInternal;

            return (
              <span className="flex items-center gap-1">
                <span>{getValue()}</span>
                {internal && (
                  <Tooltip>
                    <TooltipTrigger>
                      <UserCheckIcon className="text-blue size-4" />
                    </TooltipTrigger>
                    <TooltipContent>Internal Applicant</TooltipContent>
                  </Tooltip>
                )}
              </span>
            );
          },
        }),
        columnHelper.accessor("role", {
          id: "role",
          header: ({ column }) => {
            return <SortableHeader column={column}>ROLE</SortableHeader>;
          },
          cell: ({ getValue }) => <ApplicantRolePill role={getValue()} />,
        }),
        columnHelper.accessor("score", {
          id: "score",
          header: ({ column }) => {
            return <SortableHeader column={column}>SCORE</SortableHeader>;
          },
          cell: ({ getValue, row }) => {
            const review = row.original.interviewReviewData;
            const score = getValue();
            if (!review?.submitted) {
              return "INC";
            } else {
              return score?.value && score?.outOf
                ? `${score.value}/${score.outOf}`
                : `N/A`;
            }
          },
          sortingFn: (a, b) => {
            return (
              (a.original.score?.value ?? 0) - (b.original.score?.value ?? 0)
            );
          },
        }),
        columnHelper.accessor("interviewReviewData", {
          id: "review-status",
          header: ({ column }) => {
            return <SortableHeader column={column}>ACTION</SortableHeader>;
          },
          cell: ({ getValue, row }) => {
            const review = getValue();
            const rowData = row.original;
            if (review) {
              return (
                <Button
                  onClick={() =>
                    handleInterview(
                      review,
                      rowData.applicant.id,
                      rowData.responseId,
                      rowData.role,
                    )
                  }
                  variant="outline"
                  className="border-2 rounded-full"
                >
                  {review?.submitted ? "View" : "Edit"}
                </Button>
              );
            } else {
              return (
                <Button
                  onClick={() =>
                    handleInterview(
                      review,
                      rowData.applicant.id,
                      rowData.responseId,
                      rowData.role,
                    )
                  }
                  variant="outline"
                  className="border-2 rounded-full"
                >
                  Score
                </Button>
              );
            }
          },
          sortingFn: (a, b) => {
            const reviewA = a.original.interviewReviewData;
            const reviewB = b.original.interviewReviewData;

            // Determine status: 2 = complete, 1 = in progress, 0 = not started
            const getStatus = (
              review: ApplicationInterviewData | undefined,
            ) => {
              if (!review) return 0; // not started
              if (review.submitted) return 2; // complete
              return 1; // in progress
            };

            return getStatus(reviewA) - getStatus(reviewB);
          },
          filterFn: (row, columnId, filterValue) => {
            const value = row.getValue(columnId) as
              | ApplicationInterviewData
              | undefined;

            const isInterviewData = (
              v: unknown,
            ): v is ApplicationInterviewData =>
              typeof v === "object" && v !== null && "submitted" in v;

            if (filterValue === "all") return true;
            else if (filterValue === "pending")
              return !isInterviewData(value) || value.submitted === false;
            else if (filterValue === "completed")
              return isInterviewData(value) && value.submitted === true;
            else return true;
          },
        }),
      ] as ColumnDef<InterviewAssignmentRow>[],
    [columnHelper, handleInterview],
  );

  const { data: rows, isPending, error } = useRows(assignments, formId);

  if (isPending || !rows) return <p>Loading...</p>;
  if (error) return <p>Something went wrong: {error.message}</p>;

  return (
    <div className="flex flex-col w-full gap-2">
      <DataTable
        columns={cols}
        data={rows}
        className="border-none rounded-none"
        options={{
          getPaginationRowModel: getPaginationRowModel(),
          rowCount: rowCount,
          enableGlobalFilter: true,
          state: {
            globalFilter: search,
            pagination,
            columnFilters: [
              {
                id: "review-status",
                value: statusFilter,
              },
            ],
          },
        }}
      />
      <div className="flex flex-row gap-2">
        <span>
          Page {pagination.pageIndex + 1} of{" "}
          {Math.max(Math.ceil(assignments.length / rowCount), 1)}
        </span>
        <div className="ml-auto">
          <Button
            variant="outline"
            disabled={pagination.pageIndex <= 0}
            onClick={() =>
              setPagination({
                ...pagination,
                pageIndex: pagination.pageIndex - 1,
              })
            }
          >
            Previous Page
          </Button>
          <Button
            variant="outline"
            disabled={
              (pagination.pageIndex + 1) * rowCount >= assignments.length
            }
            onClick={() =>
              setPagination({
                ...pagination,
                pageIndex: pagination.pageIndex + 1,
              })
            }
          >
            Next Page
          </Button>
        </div>
      </div>
    </div>
  );
}
