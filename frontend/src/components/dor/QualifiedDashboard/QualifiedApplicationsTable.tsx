import type { ApplicantRole } from "@app-portal/shared/constants";
import { useCallback, useMemo, useState } from "react";
import { DataTable } from "@/components/DataTable";
import { Button } from "@/components/ui/button";
import { ExportRoleDialogButton } from "@/components/ExportRoleDialogButton";
import type { ApplicationResponse, ReviewCapableUser } from "@/types/types";
import { ReviewStatus } from "@/types/types";
import type { ColumnDef } from "@tanstack/react-table";
import {
  createColumnHelper,
  getPaginationRowModel,
} from "@tanstack/react-table";
import RolePill from "@/components/role-pill/RolePill";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { throwSuccessToast } from "@/components/toasts/SuccessToast";
import { throwErrorToast } from "@/components/toasts/ErrorToast";
import type { QualifiedAppRow } from "./useRows";
import { flattenRows, useRows } from "./useRows";
import SortableHeader from "@/components/tables/SortableHeader";
import { updateApplicationStatus } from "@/services/statusService";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CircleAlertIcon,
  Clipboard,
  EllipsisVertical,
  AlertTriangle,
  ClipboardIcon,
  UserCheckIcon,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { displayTimestamp } from "@/utils/dates";
import {
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "../../ui/dropdown-menu";
import { useNavigate } from "react-router-dom";
import { displayReviewStatus } from "@/utils/display";
import { throwWarningToast } from "@/components/toasts/WarningToast";

function StatusSelect({
  currentStatus,
  onStatusChange,
  disabled = false,
  assignedInterviewers,
}: {
  currentStatus: ReviewStatus;
  onStatusChange: (newStatus: ReviewStatus) => void;
  disabled?: boolean;
  assignedInterviewers: boolean;
}) {
  return (
    <div className="flex items-center gap-2">
      <Select
        value={currentStatus}
        onValueChange={onStatusChange}
        disabled={disabled}
      >
        <SelectTrigger className="w-40">
          <SelectValue placeholder="Select status" />
        </SelectTrigger>
        <SelectContent>
          {[
            ReviewStatus.UnderReview,
            ReviewStatus.Interview,
            ReviewStatus.Accepted,
            ReviewStatus.Waitlisted,
            ReviewStatus.Denied,
          ].map((status) => (
            <SelectItem key={status} value={status}>
              {displayReviewStatus(status)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {currentStatus === ReviewStatus.UnderReview && assignedInterviewers && (
        <Tooltip>
          <TooltipTrigger>
            <CircleAlertIcon className="text-orange-500" />
          </TooltipTrigger>
          <TooltipContent>
            Make sure to change status to interview if you plan to interview
            this applicant!
          </TooltipContent>
        </Tooltip>
      )}
    </div>
  );
}

export default function QualifiedApplicationsTable({
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
  const [statusFilter, setStatusFilter] = useState<"all" | ReviewStatus>("all");
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const updateStatusMutation = useMutation({
    mutationFn: ({
      statusId,
      newStatus,
    }: {
      statusId: string;
      newStatus: ReviewStatus;
    }) => updateApplicationStatus(statusId, { status: newStatus }),
    onMutate: async ({ statusId, newStatus }) => {
      const queryKey = [
        "qualified-apps-rows",
        formId,
        applications.map((a) => a.id).sort(),
      ];
      await queryClient.cancelQueries({ queryKey });

      const previousRows =
        queryClient.getQueryData<QualifiedAppRow[]>(queryKey);

      queryClient.setQueryData<QualifiedAppRow[]>(queryKey, (old) => {
        if (!old) return [];
        return old.map((row: QualifiedAppRow): QualifiedAppRow => {
          if (row.status?.id === statusId) {
            return {
              ...row,
              status: {
                ...row.status,
                status: newStatus,
              },
            };
          }
          return row;
        });
      });

      return { previousRows, queryKey };
    },
    onError: (error, _vars, context) => {
      if (context?.previousRows) {
        queryClient.setQueryData(context.queryKey, context.previousRows);
      }
      throwErrorToast("Failed to update status!");
      console.error(error);
    },
    onSuccess: () => {
      throwSuccessToast("Successfully updated status!");
    },
    onSettled: (_data, _error, _variables, context) => {
      if (context?.queryKey) {
        queryClient.invalidateQueries({ queryKey: context.queryKey });
      } else {
        queryClient.invalidateQueries({
          predicate: (q) => q.queryKey.includes("qualified-apps-rows"),
        });
      }
      queryClient.invalidateQueries({
        predicate: (q) => q.queryKey.includes("all-apps-rows"),
      });
    },
  });

  const { data: rows, isPending, error } = useRows(applications, formId);

  const columnHelper = createColumnHelper<QualifiedAppRow>();
  const cols = useMemo(
    () =>
      [
        columnHelper.accessor("index", {
          id: "number",
          header: ({ column }) => (
            <SortableHeader column={column}>S. NO</SortableHeader>
          ),
        }),
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
            const internal = row.original.internal;
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
                <Tooltip>
                  <TooltipTrigger>
                    <Button
                      variant={"outline"}
                      className="p-0 size-6"
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
                    >
                      <Clipboard className=" rounded cursor-pointer text-blue" />
                    </Button>
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
            const interviewers = getValue();
            const interviews = row.original.interviews;
            const role = row.original.role;

            const complete = (interviewer: ReviewCapableUser) => {
              return !!interviews.find(
                (interview) =>
                  interview.submitted &&
                  interview.interviewerId === interviewer.id &&
                  interview.forRole === role,
              );
            };

            if (interviewers.length === 0) {
              return "N/A";
            }

            return (
              <div className="flex flex-wrap items-center gap-1 max-h-20 max-w-64 overflow-y-scroll no-scrollbar">
                {interviewers.map((interviewer) => (
                  <div
                    key={interviewer.id}
                    className={`rounded-full border h-7 px-2 py-1 text-sm flex flex-row gap-1 items-center ${complete(interviewer) ? "bg-green-200 text-green-800 border-green-100" : "bg-muted"}`}
                  >
                    <span className="text-sm">
                      {interviewer.firstName} {interviewer.lastName}
                    </span>
                  </div>
                ))}
              </div>
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
              <StatusSelect
                assignedInterviewers={row.original.assignments.length > 0}
                currentStatus={status.status}
                onStatusChange={(newStatus) => {
                  updateStatusMutation.mutate({
                    statusId: status.id,
                    newStatus,
                  });
                }}
                disabled={updateStatusMutation.isPending}
              />
            );
          },
          filterFn: (row, columnId, filterValue) => {
            const value = row.getValue(columnId);
            if (filterValue === "all") return true;
            else return filterValue === value;
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
    [columnHelper, formId, navigate, updateStatusMutation],
  );

  const handleCopyEmails = useCallback(async () => {
    if (!rows || rows.length === 0) {
      throwWarningToast("No data to copy");
      return;
    }

    const filteredEmails = new Set(
      rows
        .filter(
          (r) => statusFilter === "all" || r.status?.status === statusFilter,
        )
        .map((r) => r.email),
    );
    const text = [...filteredEmails].join(",");

    try {
      await navigator.clipboard.writeText(text);
      throwSuccessToast(`Copied ${filteredEmails.size} email(s)!`);
    } catch (err) {
      console.log("Failed to copy emails: ", err);
      throwErrorToast("Failed to copy emails");
    }
  }, [rows, statusFilter]);

  if (isPending) return <p>Loading...</p>;
  if (error) return <p>Something went wrong: {error.message}</p>;

  return (
    <div className="flex flex-col w-full gap-2">
      <div className="mt-2 flex items-center flex-row gap-2">
        <span className="">Status: </span>
        <Select
          value={statusFilter}
          onValueChange={(v) => setStatusFilter(v as "all" | ReviewStatus)}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            {Object.values(ReviewStatus).map((s) => (
              <SelectItem value={s} key={s}>
                {displayReviewStatus(s)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="ml-auto flex gap-2">
          <ExportRoleDialogButton
            onExport={(role) => flattenRows(rows ?? [], role)}
            filenamePrefix="qualified"
          />
          <Button variant="outline" onClick={handleCopyEmails}>
            <ClipboardIcon /> Copy{" "}
            {displayReviewStatus(statusFilter).toLocaleLowerCase()}{" "}
            <span className="italic">qualified</span> applicant emails
          </Button>
        </div>
      </div>
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
              {
                id: "status",
                value: statusFilter,
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
