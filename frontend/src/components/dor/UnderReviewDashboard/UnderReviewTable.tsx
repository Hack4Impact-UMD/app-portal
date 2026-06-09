import type { ApplicantRole } from "@app-portal/shared/constants";
import { ReviewStatus } from "@app-portal/shared/constants";
import type {
  AppReviewAssignment,
  InternalApplicationStatus,
} from "@app-portal/shared/types";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import {
  createColumnHelper,
  getPaginationRowModel,
} from "@tanstack/react-table";
import {
  EllipsisVertical,
  ClipboardIcon,
  AlertTriangle,
  UserCheckIcon,
} from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { DataTable } from "@/components/DataTable";
import { qualifiedRowsQueryRoot } from "@/components/dor/QualifiedDashboard/useRows";
import { reviewerRowsQueryRoot } from "@/components/dor/ReviewersDashboard/useRows";
import { ExportRoleDialogButton } from "@/components/ExportRoleDialogButton";
import ApplicantRolePill from "@/components/role-pill/RolePill";
import SortableHeader from "@/components/tables/SortableHeader";
import { throwErrorToast } from "@/components/toasts/ErrorToast";
import { throwSuccessToast } from "@/components/toasts/SuccessToast";
import { throwWarningToast } from "@/components/toasts/WarningToast";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { applicationStatusQueries } from "@/hooks/useApplicationStatus";
import { reviewAssignmentQueries } from "@/hooks/useReviewAssignments";
import {
  assignReview,
  removeReviewAssignment,
} from "@/services/reviewAssignmentService";
import { getReviewDataForAssignment } from "@/services/reviewDataService";
import { updateApplicationStatus } from "@/services/statusService";
import type { ApplicationResponse, ReviewCapableUser } from "@/types/types";
import { displayTimestamp } from "@/utils/dates";
import { displayReviewStatus } from "@/utils/display";

import { AutoAssignButton } from "./AutoAssignButton";
import { ReviewerSelect } from "./ReviewerSelect";
import type { ApplicationRow } from "./useRows";
import {
  flattenRows,
  underReviewRowsQueryOptions,
  underReviewRowsQueryRoot,
  useRows,
} from "./useRows";

type SuperReviewerApplicationsTableProps = {
  applications: ApplicationResponse[];
  search: string;
  rowCount?: number;
  roleFilter: "all" | ApplicantRole;
  formId: string;
};

export default function SuperReviewerApplicationsTable({
  applications,
  search,
  formId,
  rowCount = 20,
  roleFilter = "all",
}: SuperReviewerApplicationsTableProps) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const [statusFilter, setStatusFilter] = useState<"all" | ReviewStatus>("all");

  const addReviewerMutation = useMutation({
    mutationFn: async ({
      reviewer,
      responseId,
      role,
    }: {
      pageIndex: number;
      reviewer: ReviewCapableUser;
      responseId: string;
      role: ApplicantRole;
    }) => {
      console.log("Adding assignment: ", reviewer.firstName, role, responseId);
      return await assignReview(responseId, reviewer.id, role);
    },
    onSuccess: () => {
      throwSuccessToast("Successfully assigned reviewer!");
    },
    onError: (error) => {
      throwErrorToast("Failed to assign reviewer!");
      console.log(error);
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: underReviewRowsQueryRoot,
      });
      queryClient.invalidateQueries({
        queryKey: reviewerRowsQueryRoot,
      });
      queryClient.invalidateQueries({ queryKey: reviewAssignmentQueries.root });
    },
  });

  const removeReviewerMutation = useMutation({
    mutationFn: async ({
      assignment,
    }: {
      assignment: AppReviewAssignment;
      pageIndex: number;
    }) => {
      if ((await getReviewDataForAssignment(assignment)) !== undefined)
        throw new Error(
          "The reviewer has already started their review for this assignment. It is not possible to delete it.",
        );
      return await removeReviewAssignment(assignment.id);
    },
    onSuccess: () => {
      throwSuccessToast("Successfully removed reviewer assignment!");
    },
    onError: (error) => {
      throwErrorToast(
        `Failed to remove reviewer assignment! (${error.message})`,
      );
      console.log(error);
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: underReviewRowsQueryRoot,
      });
      queryClient.invalidateQueries({
        queryKey: reviewerRowsQueryRoot,
      });
      queryClient.invalidateQueries({
        queryKey: reviewAssignmentQueries.root,
      });
    },
  });

  const toggleQualifiedMutation = useMutation({
    mutationFn: async ({ status }: { status: InternalApplicationStatus }) => {
      return await updateApplicationStatus(status.id, {
        isQualified: !status.isQualified,
      });
    },
    onMutate: async ({ status }) => {
      const rowsOptions = underReviewRowsQueryOptions(applications, formId);
      await queryClient.cancelQueries({
        queryKey: rowsOptions.queryKey,
      });
      const oldRows = queryClient.getQueryData(rowsOptions.queryKey);

      queryClient.setQueryData(rowsOptions.queryKey, (old) => {
        if (!old) return old;
        old?.map((row) => {
          if (row.status?.id === status.id) {
            return {
              ...row,
              status: {
                ...status,
                isQualified: !status.isQualified,
              },
            };
          } else {
            return row;
          }
        });
      });

      return {
        oldRows,
        rowsKey: rowsOptions.queryKey,
      };
    },
    onError: (error, _resp, ctx) => {
      if (ctx?.rowsKey) {
        queryClient.setQueryData(ctx.rowsKey, ctx.oldRows);
      }
      throwErrorToast("Failed to update qualified status: " + error);
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: underReviewRowsQueryRoot,
      });
      queryClient.invalidateQueries({
        queryKey: qualifiedRowsQueryRoot,
      });
      queryClient.invalidateQueries({
        queryKey: applicationStatusQueries.root,
      });
    },
  });

  // const deleteAllReviewsMutation = useMutation({
  //   mutationFn: async () => await deleteReviewAssignmentsAndDataForForm(formId),
  //   onSuccess: () => {
  //     throwSuccessToast("Successfully deleted all review data and assignments for this form!")
  //   },
  //   onError: (err) => {
  //     throwErrorToast("failed")
  //     console.error(err)
  //   },
  //   onSettled: () => {
  //     queryClient.invalidateQueries({
  //       queryKey: underReviewRowsQueryRoot,
  //     });
  //     queryClient.invalidateQueries({
  //       queryKey: reviewerRowsQueryRoot,
  //     });
  //     queryClient.invalidateQueries({
  //       predicate: (q) =>
  //         q.queryKey.includes("assignments") ||
  //         q.queryKey.includes("assignment"),
  //     });
  //   }
  // })

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
            const rowData = row.original;
            const role = rowData.role;
            return (
              <ReviewerSelect
                reviewers={getValue()}
                reviews={row.original.reviews.reviewData}
                onAdd={(reviewer) =>
                  addReviewerMutation.mutate({
                    pageIndex: pagination.pageIndex,
                    reviewer: reviewer,
                    responseId: rowData.responseId,
                    role: role,
                  })
                }
                assignments={row.original.reviews.assignments}
                onDelete={(_reviewer, assignment) =>
                  removeReviewerMutation.mutate({
                    pageIndex: pagination.pageIndex,
                    assignment: assignment,
                  })
                }
                responseId={row.original.responseId}
                role={role}
                disabled={
                  addReviewerMutation.isPending ||
                  removeReviewerMutation.isPending
                }
              />
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
          cell: ({ getValue, row }) => {
            const status = row.original.status;
            return (
              <div className="flex items-center justify-center">
                <Checkbox
                  className="size-5"
                  checked={getValue()}
                  onClick={() =>
                    status
                      ? toggleQualifiedMutation.mutate({
                          status: status,
                        })
                      : throwErrorToast("No status available!")
                  }
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
    [
      addReviewerMutation,
      columnHelper,
      formId,
      navigate,
      pagination.pageIndex,
      removeReviewerMutation,
      toggleQualifiedMutation,
    ],
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
          <AutoAssignButton formId={formId} />
          <ExportRoleDialogButton
            onExport={(role) => flattenRows(rows ?? [], role)}
            filenamePrefix="under-review"
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
