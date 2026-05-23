import type { ApplicantRole } from "@app-portal/shared/constants";
import { ReviewStatus } from "@app-portal/shared/constants";
import type { ApplicationResponse } from "@/types/types";
import type { ColumnDef } from "@tanstack/react-table";
import {
  createColumnHelper,
  getPaginationRowModel,
} from "@tanstack/react-table";
import { useCallback, useMemo, useState } from "react";
import { DataTable } from "../../DataTable";
import { Button } from "../../ui/button";
import {
  ClipboardIcon,
  AlertTriangle,
  UserCheckIcon,
  EllipsisVertical,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { throwSuccessToast } from "../../toasts/SuccessToast";
import { throwErrorToast } from "../../toasts/ErrorToast";
import ApplicantRolePill from "../../role-pill/RolePill";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "../../ui/dropdown-menu";
import SortableHeader from "../../tables/SortableHeader";
import type { ApplicationRow } from "../../dor/UnderReviewDashboard/useRows";
import { flattenRows, useRows } from "../../dor/UnderReviewDashboard/useRows";
import { displayTimestamp } from "@/utils/dates";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { displayReviewStatus } from "@/utils/display";
import { throwWarningToast } from "@/components/toasts/WarningToast";
import { ExportRoleDialogButton } from "@/components/ExportRoleDialogButton";

type BoardApplicationsTableProps = {
  applications: ApplicationResponse[];
  search: string;
  rowCount?: number;
  roleFilter: "all" | ApplicantRole;
  formId: string;
};

export default function BoardApplicationsTable({
  applications,
  search,
  formId,
  rowCount = 20,
  roleFilter = "all",
}: BoardApplicationsTableProps) {
  const navigate = useNavigate();

  const [statusFilter, setStatusFilter] = useState<"all" | ReviewStatus>("all");

  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: rowCount,
  });

  const columnHelper = createColumnHelper<ApplicationRow>();
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
        columnHelper.accessor("applicant.name", {
          id: "applicant-name",
          header: ({ column }) => {
            return <SortableHeader column={column}>APPLICANT</SortableHeader>;
          },
          cell: ({ getValue, row }) => {
            const previouslyApplied =
              row.original.applicant.previouslyAppliedCount ?? 0;
            const internal = row.original.applicant.internal;

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
                {previouslyApplied > 0 && (
                  <Tooltip>
                    <TooltipTrigger>
                      <span className="bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded-full cursor-default">
                        {previouslyApplied}
                      </span>
                    </TooltipTrigger>
                    <TooltipContent>
                      {previouslyApplied === 0
                        ? "No previous applications"
                        : `Applied in ${previouslyApplied} previous semester${previouslyApplied > 1 ? "s" : ""}`}
                    </TooltipContent>
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
          filterFn: (row, columnId, filterValue) => {
            const value = row.getValue(columnId);

            if (filterValue === "all") return true;
            else return filterValue === value;
          },
        }),
        columnHelper.accessor("reviewers.assigned", {
          id: "reviewers",
          header: "REVIEWERS",
          cell: ({ getValue, row }) => {
            const reviewers = getValue();
            const reviews = row.original.reviews.reviewData;
            const role = row.original.role;

            const complete = (reviewerId: string) => {
              return reviews.find(
                (review) =>
                  review.submitted &&
                  review.reviewerId === reviewerId &&
                  review.forRole === role,
              );
            };

            if (reviewers.length === 0) {
              return "N/A";
            }

            return (
              <div className="flex flex-wrap items-center gap-1 max-h-20 max-w-64 overflow-y-scroll no-scrollbar">
                {reviewers.map((reviewer) => (
                  <div
                    key={reviewer.id}
                    className={`rounded-full border h-7 px-2 py-1 text-sm flex flex-row gap-1 items-center ${
                      complete(reviewer.id)
                        ? "bg-green-200 text-green-800 border-green-100"
                        : "bg-muted"
                    }`}
                  >
                    <span className="text-sm">
                      {reviewer.firstName} {reviewer.lastName}
                    </span>
                  </div>
                ))}
              </div>
            );
          },
        }),
        columnHelper.accessor("reviews.completed", {
          id: "assigned-reviews",
          header: ({ column }) => {
            return <SortableHeader column={column}>REVIEWED</SortableHeader>;
          },
          cell: ({ getValue, row }) => {
            const completed = getValue();
            const assigned = row.original.reviews.assigned;

            return `${completed}/${assigned}`;
          },
        }),
        columnHelper.accessor("reviews.averageScore", {
          id: "avg-score",
          header: ({ column }) => {
            return <SortableHeader column={column}>AVG. SCORE</SortableHeader>;
          },
          cell: ({ getValue, row }) => {
            if (row.original.reviews.completed === 0) return "N/A";
            const hasLowScore = row.original.reviews.reviewData.some(
              (reviewData) =>
                reviewData.submitted &&
                Object.values(reviewData.applicantScores).some(
                  (score) => score < 2,
                ),
            );
            return (
              <div className="flex items-center">
                {getValue()}
                {hasLowScore && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="bg-amber-100 rounded-full w-6 h-6 ml-1 flex items-center justify-center -mt-0.5">
                        <AlertTriangle className="h-4 w-4 text-amber-600" />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>
                        This candidate received a score below 2 from a reviewer
                      </p>
                    </TooltipContent>
                  </Tooltip>
                )}
              </div>
            );
          },
        }),
        columnHelper.accessor("status.isQualified", {
          id: "qualified",
          cell: ({ getValue }) => {
            return (
              <div className="flex items-center justify-center">
                <Checkbox
                  className="size-5"
                  checked={getValue()}
                  disabled={true}
                />
              </div>
            );
          },
          header: () => {
            return (
              <div className="flex items-center justify-center">
                <span className="text-center mx-auto">QUALIFIED</span>
              </div>
            );
          },
        }),
        columnHelper.accessor("status.status", {
          id: "status",
          header: ({ column }) => (
            <SortableHeader column={column}>STATUS</SortableHeader>
          ),
          cell: ({ getValue }) => {
            const status = getValue();
            return status ? displayReviewStatus(status) : "N/A";
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
      ] as ColumnDef<ApplicationRow>[],
    [columnHelper, formId, navigate],
  );

  const { data: rows, isPending, error } = useRows(applications, formId);

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
        .map((r) => r.applicant.email),
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
            filenamePrefix="all-applications"
          />
          <Button variant="outline" onClick={handleCopyEmails}>
            <ClipboardIcon /> Copy{" "}
            {displayReviewStatus(statusFilter).toLocaleLowerCase()} applicant
            emails
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
