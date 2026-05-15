import {
  AppReviewAssignment,
  ApplicantRole,
  ApplicationReviewData,
  ReviewCapableUser,
} from "@/types/types";
import {
  ColumnDef,
  createColumnHelper,
  getPaginationRowModel,
} from "@tanstack/react-table";
import { useMemo, useState } from "react";
import { DataTable } from "../../DataTable";
import { Button } from "../../ui/button";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { EllipsisVertical } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "../../ui/dropdown-menu";
import { ReviewerRow, flattenRows, useRows } from "./useRows";
import { RoleSelect } from "./RoleSelect";
import { getReviewerById, reviewingFor } from "@/services/reviewersService";
import { setReviewCapableUserRolePreferences } from "@/services/userService";
import { throwSuccessToast } from "@/components/toasts/SuccessToast";
import { throwErrorToast } from "@/components/toasts/ErrorToast";
import { ExportButton } from "@/components/ExportButton";
import SortableHeader from "@/components/tables/SortableHeader";

type ReviewersTableProps = {
  reviewers: ReviewCapableUser[];
  assignments: AppReviewAssignment[];
  reviewData: ApplicationReviewData[];
  search: string;
  rowCount?: number;
  formId: string;
  statusFilter: "all" | "complete" | "pending" | "unassigned";
};

export default function ReviewersTable({
  reviewers,
  assignments,
  reviewData,
  search,
  formId,
  rowCount = 20,
  statusFilter,
}: ReviewersTableProps) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const addRolePreferenceMutation = useMutation({
    mutationFn: async ({
      roleToAdd,
      reviewerId,
    }: {
      roleToAdd: ApplicantRole;
      reviewerId: string;
      pageIndex: number;
    }) => {
      const prevRolePreferences = reviewingFor(
        await getReviewerById(reviewerId),
      );
      const newRolePreferences = [...prevRolePreferences, roleToAdd];
      return await setReviewCapableUserRolePreferences(
        reviewerId,
        newRolePreferences,
      );
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["reviewers"] });
      throwSuccessToast("Successfully added role preference!");
    },
    onError: (error) => {
      throwErrorToast(`Failed to add role preference! (${error.message})`);
      console.log(error);
    },
  });

  const removeRolePreferenceMutation = useMutation({
    mutationFn: async ({
      roleToRemove,
      reviewerId,
    }: {
      roleToRemove: ApplicantRole;
      reviewerId: string;
      pageIndex: number;
    }) => {
      const prevRolePreferences = reviewingFor(
        await getReviewerById(reviewerId),
      );
      const newRolePreferences = prevRolePreferences.filter(
        (role) => role !== roleToRemove,
      );
      return await setReviewCapableUserRolePreferences(
        reviewerId,
        newRolePreferences,
      );
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["reviewers"] });
      throwSuccessToast("Successfully removed role preference!");
    },
    onError: (error) => {
      throwErrorToast(`Failed to remove role preference! (${error.message})`);
      console.log(error);
    },
  });

  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: rowCount,
  });

  const columnHelper = createColumnHelper<ReviewerRow>();
  const cols = useMemo(
    () =>
      [
        columnHelper.accessor("index", {
          id: "number",
          header: ({ column }) => {
            return <SortableHeader column={column}>S. NO</SortableHeader>;
          },
        }),
        columnHelper.accessor("reviewer.name", {
          id: "reviewer-name",
          header: ({ column }) => {
            return <SortableHeader column={column}>REVIEWER</SortableHeader>;
          },
        }),
        columnHelper.accessor("rolePreferences", {
          id: "role-preferences",
          header: "ROLES REVIEWING",
          cell: ({ getValue, row }) => {
            return (
              <RoleSelect
                rolePreferences={getValue()}
                onAdd={(role, reviewerId) =>
                  addRolePreferenceMutation.mutate({
                    pageIndex: pagination.pageIndex,
                    roleToAdd: role,
                    reviewerId: reviewerId,
                  })
                }
                onDelete={(role, reviewerId) =>
                  removeRolePreferenceMutation.mutate({
                    pageIndex: pagination.pageIndex,
                    roleToRemove: role,
                    reviewerId: reviewerId,
                  })
                }
                reviewerId={row.original.reviewer.id}
                disabled={
                  addRolePreferenceMutation.isPending ||
                  removeRolePreferenceMutation.isPending
                }
              />
            );
          },
        }),
        columnHelper.accessor("assignments", {
          id: "assignments",
          header: ({ column }) => {
            return <SortableHeader column={column}>ASSIGNMENTS</SortableHeader>;
          },
        }),
        columnHelper.accessor("pendingAssignments", {
          id: "pending-assignments",
          header: ({ column }) => {
            return <SortableHeader column={column}>PENDING</SortableHeader>;
          },
          filterFn: ({ original }, _, filterValue) => {
            if (filterValue === "all") return true;
            else if (filterValue === "complete")
              return (
                original.pendingAssignments === 0 && original.assignments > 0
              );
            else if (filterValue === "pending")
              return original.pendingAssignments > 0;
            else if (filterValue === "unassigned")
              return (
                original.pendingAssignments === 0 && original.assignments === 0
              );
            else return true;
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
                        "/admin/board/reviewer/" +
                          formId +
                          "/" +
                          row.original.reviewer.id,
                      );
                    }}
                  >
                    View Applications
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ),
        }),
      ] as ColumnDef<ReviewerRow>[],
    [
      addRolePreferenceMutation,
      columnHelper,
      formId,
      navigate,
      pagination.pageIndex,
      removeRolePreferenceMutation,
    ],
  );

  const {
    data: rows,
    isPending,
    error,
  } = useRows(reviewers, assignments, reviewData);

  if (isPending) return <p>Loading...</p>;
  if (error) return <p>Something went wrong: {error.message}</p>;

  return (
    <div className="flex flex-col w-full gap-2">
      <ExportButton data={flattenRows(rows)} filename="h4i_reviewers" />
      <DataTable
        columns={cols}
        data={rows ?? []}
        className="border-none rounded-none"
        options={{
          getPaginationRowModel: getPaginationRowModel(),
          rowCount: rowCount,
          enableGlobalFilter: true,
          enableColumnFilters: true,
          state: {
            globalFilter: search,
            pagination,
            columnFilters: [
              {
                id: "pending-assignments",
                value: statusFilter,
              },
            ],
          },
        }}
      />
      <div className="flex flex-row gap-2">
        <span>
          Page {pagination.pageIndex + 1} of{" "}
          {Math.max(Math.ceil(reviewers.length / rowCount), 1)}
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
            disabled={(pagination.pageIndex + 1) * rowCount >= reviewers.length}
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
