import type {
  InterviewAssignment,
  ApplicationInterviewData,
} from "@app-portal/shared/types";
import type { ReviewCapableUser } from "@/types/types";
import type { ColumnDef } from "@tanstack/react-table";
import {
  createColumnHelper,
  getPaginationRowModel,
} from "@tanstack/react-table";
import { useMemo, useState } from "react";
import { DataTable } from "@/components/DataTable";
import { Button } from "@/components/ui/button";
import { EllipsisVertical } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { InterviewerRow } from "./useRows";
import { flattenRows, useRows } from "./useRows";
// import { RoleSelect } from "./RoleSelect";
import { ExportButton } from "@/components/ExportButton";
import SortableHeader from "@/components/tables/SortableHeader";

type InterviewersTableProps = {
  interviewers: ReviewCapableUser[];
  interviewData: ApplicationInterviewData[];
  assignments: InterviewAssignment[];
  search: string;
  rowCount?: number;
  formId: string;
  statusFilter: "all" | "complete" | "pending" | "unassigned";
};

export default function InterviewersTable({
  interviewers,
  interviewData,
  assignments,
  search,
  formId,
  rowCount = 20,
  statusFilter,
}: InterviewersTableProps) {
  const navigate = useNavigate();

  //   const addRolePreferenceMutation = useMutation({
  //     mutationFn: async ({
  //       roleToAdd,
  //       reviewerId,
  //     }: {
  //       roleToAdd: ApplicantRole;
  //       reviewerId: string;
  //       pageIndex: number;
  //     }) => {
  //       const prevRolePreferences = (await getReviewerById(reviewerId))
  //         .applicantRolePreferences;
  //       const newRolePreferences = [...prevRolePreferences, roleToAdd];
  //       return await setReviewerRolePreferences(reviewerId, newRolePreferences);
  //     },
  //     onSuccess: () => {
  //       throwSuccessToast("Successfully added role preference!");
  //     },
  //     onError: (error) => {
  //       throwErrorToast(`Failed to add role preference! (${error.message})`);
  //       console.log(error);
  //     },
  //     onSettled: (_data, _err, variables) => {
  //       queryClient.invalidateQueries({
  //         queryKey: ["all-reviewers-rows", variables.pageIndex],
  //       });
  //     },
  //   });

  //   const removeRolePreferenceMutation = useMutation({
  //     mutationFn: async ({
  //       roleToRemove,
  //       reviewerId,
  //     }: {
  //       roleToRemove: ApplicantRole;
  //       reviewerId: string;
  //       pageIndex: number;
  //     }) => {
  //       const prevRolePreferences = (await getReviewerById(reviewerId))
  //         .applicantRolePreferences;
  //       const newRolePreferences = prevRolePreferences.filter(
  //         (role) => role != roleToRemove,
  //       );
  //       return await setReviewerRolePreferences(reviewerId, newRolePreferences);
  //     },
  //     onSuccess: () => {
  //       throwSuccessToast("Successfully removed role preference!");
  //     },
  //     onError: (error) => {
  //       throwErrorToast(`Failed to remove role preference! (${error.message})`);
  //       console.log(error);
  //     },
  //     onSettled: (_data, _err, variables) => {
  //       queryClient.invalidateQueries({
  //         queryKey: ["all-reviewers-rows", variables.pageIndex],
  //       });
  //     },
  //   });

  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: rowCount,
  });

  const columnHelper = createColumnHelper<InterviewerRow>();
  const cols = useMemo(
    () =>
      [
        columnHelper.accessor("index", {
          id: "number",
          header: ({ column }) => {
            return <SortableHeader column={column}>S. NO</SortableHeader>;
          },
        }),
        columnHelper.accessor("interviewer.name", {
          id: "interviewer-name",
          header: ({ column }) => {
            return <SortableHeader column={column}>INTERVIEWER</SortableHeader>;
          },
        }),
        // columnHelper.accessor("rolePreferences", {
        //   id: "role-preferences",
        //   header: "ROLES REVIEWING",
        //   cell: ({ getValue, row }) => {
        //     return (
        //       <RoleSelect
        //         rolePreferences={getValue()}
        //         onAdd={(role, reviewerId) =>
        //           addRolePreferenceMutation.mutate({
        //             pageIndex: pagination.pageIndex,
        //             roleToAdd: role,
        //             reviewerId: reviewerId,
        //           })
        //         }
        //         onDelete={(role, reviewerId) =>
        //           removeRolePreferenceMutation.mutate({
        //             pageIndex: pagination.pageIndex,
        //             roleToRemove: role,
        //             reviewerId: reviewerId,
        //           })
        //         }
        //         reviewerId={row.original.reviewer.id}
        //       />
        //     );
        //   },
        // }),
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
                original.pendingAssignments === 0 && original.assignments !== 0
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
                        "/admin/board/interviewer/" +
                          formId +
                          "/" +
                          row.original.interviewer.id,
                      );
                    }}
                  >
                    View Interviewer
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ),
        }),
      ] as ColumnDef<InterviewerRow>[],
    [columnHelper],
  );

  const {
    data: rows,
    isPending,
    error,
  } = useRows(interviewers, interviewData, assignments);

  if (isPending) return <p>Loading...</p>;
  if (error) return <p>Something went wrong: {error.message}</p>;

  return (
    <div className="flex flex-col w-full gap-2">
      <ExportButton data={flattenRows(rows)} filename="h4i_interviewers" />
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
          {Math.max(Math.ceil(interviewers.length / rowCount), 1)}
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
              (pagination.pageIndex + 1) * rowCount >= interviewers.length
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
