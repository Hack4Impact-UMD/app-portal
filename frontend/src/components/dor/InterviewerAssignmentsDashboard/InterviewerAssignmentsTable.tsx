import type {
  InterviewAssignment,
  ApplicationInterviewData,
} from "@app-portal/shared/types";
import type { ColumnDef } from "@tanstack/react-table";
import {
  createColumnHelper,
  getPaginationRowModel,
} from "@tanstack/react-table";
import { useMemo, useState } from "react";
import { DataTable } from "@/components/DataTable";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import ApplicantRolePill from "@/components/role-pill/RolePill";
import type { AssignedInterviewRow } from "./useRows";
import { useRows } from "./useRows";
import { throwErrorToast } from "@/components/toasts/ErrorToast";

type InterviewerAssignmentsTableProps = {
  assignments: InterviewAssignment[];
  search: string;
  rowCount?: number;
  statusFilter: "all" | "reviewed" | "pending";
  formId: string;
};

export default function InterviewerAssignmentsTable({
  assignments,
  search,
  formId,
  rowCount = 20,
  statusFilter = "all",
}: InterviewerAssignmentsTableProps) {
  const navigate = useNavigate();

  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: rowCount,
  });

  const columnHelper = createColumnHelper<AssignedInterviewRow>();
  const cols = useMemo(
    () =>
      [
        columnHelper.accessor("index", {
          id: "number",
          header: ({ column }) => {
            return (
              <Button
                variant="ghost"
                className="p-0"
                onClick={() =>
                  column.toggleSorting(column.getIsSorted() === "asc")
                }
              >
                <span className="flex items-center flex-row gap-1">
                  S. NO
                  {column.getIsSorted() === false ? (
                    <ArrowUpDown />
                  ) : column.getIsSorted() === "desc" ? (
                    <ArrowUp />
                  ) : (
                    <ArrowDown />
                  )}
                </span>
              </Button>
            );
          },
          cell: ({ getValue }) => getValue(),
        }),
        columnHelper.accessor("applicantName", {
          id: "applicant",
          header: ({ column }) => {
            return (
              <Button
                variant="ghost"
                className="p-0"
                onClick={() =>
                  column.toggleSorting(column.getIsSorted() === "asc")
                }
              >
                <span className="flex items-center flex-row gap-1">
                  APPLICANT
                  {column.getIsSorted() === false ? (
                    <ArrowUpDown />
                  ) : column.getIsSorted() === "desc" ? (
                    <ArrowUp />
                  ) : (
                    <ArrowDown />
                  )}
                </span>
              </Button>
            );
          },
        }),
        columnHelper.accessor("role", {
          id: "role",
          header: ({ column }) => {
            return (
              <Button
                variant="ghost"
                className="p-0"
                onClick={() =>
                  column.toggleSorting(column.getIsSorted() === "asc")
                }
              >
                <span className="flex items-center flex-row gap-1">
                  ROLE
                  {column.getIsSorted() === false ? (
                    <ArrowUpDown />
                  ) : column.getIsSorted() === "desc" ? (
                    <ArrowUp />
                  ) : (
                    <ArrowDown />
                  )}
                </span>
              </Button>
            );
          },
          cell: ({ getValue }) => <ApplicantRolePill role={getValue()} />,
        }),
        columnHelper.accessor("score", {
          id: "score",
          header: ({ column }) => {
            return (
              <Button
                variant="ghost"
                className="p-0"
                onClick={() =>
                  column.toggleSorting(column.getIsSorted() === "asc")
                }
              >
                <span className="flex items-center flex-row gap-1">
                  SCORE
                  {column.getIsSorted() === false ? (
                    <ArrowUpDown />
                  ) : column.getIsSorted() === "desc" ? (
                    <ArrowUp />
                  ) : (
                    <ArrowDown />
                  )}
                </span>
              </Button>
            );
          },
          cell: ({ getValue }) => {
            const score = getValue();
            if (!score) {
              return "INC";
            } else {
              return score.value && score.outOf
                ? `${score.value}/${score.outOf}`
                : `N/A`;
            }
          },
        }),
        columnHelper.accessor("interview", {
          id: "interview-status",
          header: ({ column }) => {
            return (
              <Button
                variant="ghost"
                className="p-0"
                onClick={() =>
                  column.toggleSorting(column.getIsSorted() === "asc")
                }
              >
                <span className="flex items-center flex-row gap-1">
                  ACTION
                  {column.getIsSorted() === false ? (
                    <ArrowUpDown />
                  ) : column.getIsSorted() === "desc" ? (
                    <ArrowUp />
                  ) : (
                    <ArrowDown />
                  )}
                </span>
              </Button>
            );
          },
          cell: ({ getValue, row }) => {
            const interview = getValue();
            const rowData = row.original;
            if (interview?.submitted) {
              return (
                <Button
                  onClick={() => handleInterview(interview, rowData.responseId)}
                  variant="outline"
                  className="border-2 rounded-full"
                >
                  View Interview
                </Button>
              );
            } else if (interview) {
              return "Interview In Progress";
            } else {
              return "Not Interviewed";
            }
          },
          filterFn: (row, columnId, filterValue) => {
            const value = row.getValue(columnId) as
              | ApplicationInterviewData
              | undefined;

            if (filterValue === "all") return true;
            else if (filterValue === "pending")
              return !(value?.submitted ?? false);
            else if (filterValue === "reviewed")
              return value?.submitted ?? false;
            else return true;
          },
        }),
      ] as ColumnDef<AssignedInterviewRow>[],
    [columnHelper],
  );

  async function handleInterview(
    interviewData: ApplicationInterviewData | undefined,
    responseId: string,
  ) {
    if (interviewData) {
      // there's an existing interview, edit it
      navigate(
        `/admin/interview/f/${interviewData.applicationFormId}/${responseId}/${interviewData.id}?edit=false`,
      );
    } else {
      throwErrorToast("Interview data does not exist!");
    }
  }

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
