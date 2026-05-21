import type { ApplicantRole } from "@app-portal/shared/types";
import type { BoardUserProfile } from "@/types/types";
import type { ColumnDef } from "@tanstack/react-table";
import {
  createColumnHelper,
  getPaginationRowModel,
} from "@tanstack/react-table";
import { useMemo, useState } from "react";
import { DataTable } from "../../DataTable";
import { Button } from "../../ui/button";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { BoardRoleSelect } from "./BoardRoleSelect";
import { getBoardMemberById } from "@/services/boardService";
import { setBoardApplicantRoles } from "@/services/userService";
import { throwSuccessToast } from "@/components/toasts/SuccessToast";
import { throwErrorToast } from "@/components/toasts/ErrorToast";
import SortableHeader from "@/components/tables/SortableHeader";
import type { BoardRow } from "./useRows";
import { useRows } from "./useRows";

type BoardMembersTableProps = {
  boardMembers: BoardUserProfile[];
  search: string;
  rowCount?: number;
  statusFilter: "all" | "complete" | "pending" | "unassigned";
};

export function BoardMembersTable({
  boardMembers,
  search,
  rowCount = 20,
}: BoardMembersTableProps) {
  const queryClient = useQueryClient();

  const addRoleMutation = useMutation({
    mutationFn: async ({
      roleToAdd,
      boardId,
    }: {
      roleToAdd: ApplicantRole;
      boardId: string;
      pageIndex: number;
    }) => {
      const prevRoles =
        (await getBoardMemberById(boardId)).applicantRoles ?? [];
      const newRoles = [...prevRoles, roleToAdd];
      return await setBoardApplicantRoles(boardId, newRoles);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["board-members"] });
      throwSuccessToast("Successfully added role!");
    },
    onError: (error) => {
      throwErrorToast(`Failed to add role! (${error.message})`);
      console.log(error);
    },
  });

  const removeRoleMutation = useMutation({
    mutationFn: async ({
      roleToRemove,
      boardId,
    }: {
      roleToRemove: ApplicantRole;
      boardId: string;
      pageIndex: number;
    }) => {
      const prevRoles =
        (await getBoardMemberById(boardId)).applicantRoles ?? [];
      const newRoles = prevRoles.filter((role) => role !== roleToRemove);
      return await setBoardApplicantRoles(boardId, newRoles);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["board-members"] });
      throwSuccessToast("Successfully removed role!");
    },
    onError: (error) => {
      throwErrorToast(`Failed to remove role! (${error.message})`);
      console.log(error);
    },
  });

  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: rowCount,
  });

  const columnHelper = createColumnHelper<BoardRow>();
  const cols = useMemo(
    () =>
      [
        columnHelper.accessor("index", {
          id: "number",
          header: ({ column }) => {
            return <SortableHeader column={column}>S. NO</SortableHeader>;
          },
        }),
        columnHelper.accessor("boardMember.name", {
          id: "board-member-name",
          header: ({ column }) => {
            return (
              <SortableHeader column={column}>BOARD MEMBER</SortableHeader>
            );
          },
        }),
        columnHelper.accessor("applicantRoles", {
          id: "applicant-roles",
          header: "ROLES ADMINISTRATING",
          cell: ({ getValue, row }) => {
            return (
              <BoardRoleSelect
                applicantRoles={getValue()}
                onAdd={(role, boardId) =>
                  addRoleMutation.mutate({
                    pageIndex: pagination.pageIndex,
                    roleToAdd: role,
                    boardId: boardId,
                  })
                }
                onDelete={(role, boardId) =>
                  removeRoleMutation.mutate({
                    pageIndex: pagination.pageIndex,
                    roleToRemove: role,
                    boardId: boardId,
                  })
                }
                boardId={row.original.boardMember.id}
                disabled={
                  addRoleMutation.isPending || removeRoleMutation.isPending
                }
              />
            );
          },
        }),
      ] as ColumnDef<BoardRow>[],
    [columnHelper, addRoleMutation, removeRoleMutation, pagination.pageIndex],
  );

  const { data: rows, isPending, error } = useRows(boardMembers);

  if (isPending) return <p>Loading...</p>;
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
          enableColumnFilters: true,
          state: {
            globalFilter: search,
            pagination,
          },
        }}
      />
      <div className="flex flex-row gap-2">
        <span>
          Page {pagination.pageIndex + 1} of{" "}
          {Math.max(Math.ceil(boardMembers.length / rowCount), 1)}
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
              (pagination.pageIndex + 1) * rowCount >= boardMembers.length
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
