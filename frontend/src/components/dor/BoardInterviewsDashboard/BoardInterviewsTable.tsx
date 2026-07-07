import type { ApplicantRole } from "@app-portal/shared/constants";
import type {
  InterviewAssignment,
  ApplicationInterviewData,
} from "@app-portal/shared/types";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import {
  createColumnHelper,
  getPaginationRowModel,
} from "@tanstack/react-table";
import { Clipboard, EllipsisVertical, AlertTriangle } from "lucide-react";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { DataTable } from "@/components/DataTable";
import type { QualifiedAppRow } from "@/components/dor/QualifiedDashboard/useRows";
import {
  qualifiedRowsQueryRoot,
  useRows,
} from "@/components/dor/QualifiedDashboard/useRows";
import RolePill from "@/components/role-pill/RolePill";
import Spinner from "@/components/Spinner";
import SortableHeader from "@/components/tables/SortableHeader";
import { throwErrorToast } from "@/components/toasts/ErrorToast";
import { throwSuccessToast } from "@/components/toasts/SuccessToast";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { interviewAssignmentQueries } from "@/hooks/useInterviewAssignments";
import {
  assignInterview,
  removeInterviewAssignment,
} from "@/services/interviewAssignmentService";
import type { ApplicationResponse, ReviewCapableUser } from "@/types/types";
import { displayTimestamp } from "@/utils/dates";

import { InterviewerSelect } from "./InterviewerSelect";

export default function BoardInterviewsTable({
  applications,
  search,
  formId,
  rowCount = 20,
  roleFilter = "all",
}: {
  applications: ApplicationResponse[];
  search: string;
  formId: string;
  rowCount?: number;
  roleFilter: "all" | ApplicantRole;
}) {
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: rowCount,
  });
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const addInterviewerMutation = useMutation({
    mutationFn: async ({
      interviewer,
      responseId,
      role,
    }: {
      interviewer: ReviewCapableUser;
      responseId: string;
      role: ApplicantRole;
    }) => {
      return await assignInterview(responseId, interviewer.id, role);
    },
    onSuccess: () => {
      throwSuccessToast("Successfully assigned interviewer!");
    },
    onError: (error) => {
      throwErrorToast("Failed to assign interviewer!");
      console.log(error);
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: qualifiedRowsQueryRoot,
      });
      queryClient.invalidateQueries({
        queryKey: interviewAssignmentQueries.root,
      });
    },
  });
  const removeInterviewerMutation = useMutation({
    mutationFn: async ({
      assignment,
      interviews,
    }: {
      assignment: InterviewAssignment;
      interviews: ApplicationInterviewData[];
    }) => {
      // Prevent removal if interview has started
      if (
        interviews.find(
          (i) => i.interviewerId === assignment.interviewerId && i.submitted,
        )
      ) {
        throw new Error(
          "The interviewer has already started their interview for this assignment. It is not possible to delete it.",
        );
      }
      return await removeInterviewAssignment(assignment.id);
    },
    onSuccess: () => {
      throwSuccessToast("Successfully removed interviewer assignment!");
    },
    onError: (error) => {
      throwErrorToast(
        `Failed to remove interviewer assignment! (${error.message})`,
      );
      console.log(error);
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: qualifiedRowsQueryRoot,
      });
      queryClient.invalidateQueries({
        queryKey: interviewAssignmentQueries.root,
      });
    },
  });

  const { data: rows, isPending, error } = useRows(applications, formId);

  const columnHelper = createColumnHelper<QualifiedAppRow>();
  const cols = useMemo(
    () =>
      [
        columnHelper.accessor("dateSubmitted", {
          id: "date-submitted",
          header: ({ column }) => {
            return <SortableHeader column={column}>DATE SUB.</SortableHeader>;
          },
          cell: ({ getValue }) => displayTimestamp(getValue()),
        }),
        columnHelper.accessor("name", {
          id: "name",
          header: ({ column }) => (
            <SortableHeader column={column}>NAME</SortableHeader>
          ),
          cell: ({ getValue, row }) => {
            return (
              <span className="flex items-center">
                <span>{getValue()}</span>
                <Tooltip>
                  <TooltipTrigger>
                    <Clipboard
                      className="hover:bg-lightgray p-1 rounded cursor-pointer text-blue"
                      size={24}
                      onClick={async () => {
                        try {
                          await navigator.clipboard.writeText(
                            row.original.email,
                          );
                          throwSuccessToast(
                            `${row.original.email} added to clipboard!`,
                          );
                        } catch (err) {
                          console.log("Failed to copy email:");
                          console.log(err);
                          throwErrorToast(`Failed to add email to clipboard.`);
                        }
                      }}
                    />
                  </TooltipTrigger>
                  <TooltipContent>Copy Applicant Email</TooltipContent>
                </Tooltip>
              </span>
            );
          },
        }),
        columnHelper.accessor("role", {
          id: "role",
          header: ({ column }) => (
            <SortableHeader column={column}>ROLE</SortableHeader>
          ),
          cell: ({ getValue }) => <RolePill role={getValue()} />,
          filterFn: (row, columnId, filterValue) => {
            const value = row.getValue(columnId);
            if (filterValue === "all") return true;
            else return filterValue === value;
          },
        }),
        columnHelper.accessor("interviewers.assigned", {
          id: "interviewers",
          header: "INTERVIEWERS",
          cell: ({ getValue, row }) => {
            const rowData = row.original;
            return (
              <InterviewerSelect
                interviewers={getValue()}
                interviews={rowData.interviews}
                onAdd={(interviewer) =>
                  addInterviewerMutation.mutate({
                    interviewer: interviewer,
                    responseId: rowData.responseId,
                    role: rowData.role,
                  })
                }
                assignments={rowData.assignments}
                onDelete={(_interviewer, assignment) =>
                  removeInterviewerMutation.mutate({
                    assignment: assignment,
                    interviews: rowData.interviews,
                  })
                }
                responseId={rowData.responseId}
                role={rowData.role}
                disabled={
                  addInterviewerMutation.isPending ||
                  removeInterviewerMutation.isPending
                }
              />
            );
          },
        }),
        columnHelper.accessor("averageScore", {
          id: "avg-score",
          header: ({ column }) => (
            <SortableHeader column={column}>AVG. SCORE</SortableHeader>
          ),
          cell: ({ getValue, row }) => {
            const value = getValue();
            if (!value) return "N/A";
            const hasLowScore = row.original.interviews.some(
              (interviewData) =>
                interviewData.submitted &&
                Object.values(interviewData.interviewScores).some(
                  (score) => score < 2,
                ),
            );
            return (
              <div className="flex items-center">
                {value.toFixed(2)}
                {hasLowScore && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="bg-amber-100 rounded-full w-6 h-6 ml-1 flex items-center justify-center -mt-0.5">
                        <AlertTriangle className="h-4 w-4 text-amber-600" />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>
                        This candidate received a score below 2 from an
                        interviewer
                      </p>
                    </TooltipContent>
                  </Tooltip>
                )}
              </div>
            );
          },
        }),
        columnHelper.accessor("status.status", {
          id: "status",
          header: ({ column }) => (
            <SortableHeader column={column}>STATUS</SortableHeader>
          ),
          cell: ({ row }) => {
            const status = row.original.status;

            if (!status) {
              return "N/A";
            }

            return (
              status.status.charAt(0).toUpperCase() +
              status.status.slice(1).replace(/-/g, " ")
            );
          },
        }),
        columnHelper.display({
          id: "actions",
          header: () => (
            <div className="flex items-center justify-center">
              <span className="text-center mx-auto">ACTIONS</span>
            </div>
          ),
          cell: ({ row }) => (
            <div className="flex items-center justify-center">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost">
                    <EllipsisVertical />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem
                    className="cursor-pointer"
                    onClick={() => {
                      navigate(
                        "/admin/board/reviews/" + row.original.responseId,
                      );
                    }}
                  >
                    View Reviews
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="cursor-pointer"
                    onClick={() => {
                      navigate(
                        "/admin/board/interviews/" + row.original.responseId,
                      );
                    }}
                  >
                    View Interviews
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="cursor-pointer"
                    onClick={() => {
                      navigate(
                        `/admin/board/application/${formId}/${row.original.responseId}`,
                      );
                    }}
                  >
                    View Application
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ),
        }),
      ] as ColumnDef<QualifiedAppRow>[],
    [columnHelper, addInterviewerMutation, removeInterviewerMutation],
  );

  if (isPending)
    return (
      <div className="flex items-center justify-center p-4 w-full h-full">
        <Spinner />
      </div>
    );
  if (error) return <p>Something went wrong: {error.message}</p>;

  return (
    <div className="flex flex-col w-full gap-2">
      <DataTable
        columns={cols}
        data={rows ?? []}
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
                id: "role",
                value: roleFilter,
              },
            ],
          },
        }}
      />
      <div className="flex flex-row gap-2">
        <span>
          Page {pagination.pageIndex + 1} of{" "}
          {Math.max(Math.ceil(applications.length / rowCount), 1)}
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
              (pagination.pageIndex + 1) * rowCount >= applications.length
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
