import type { DecisionConfirmation } from "@app-portal/shared/types";
import type { ColumnDef } from "@tanstack/react-table";
import {
  createColumnHelper,
  getPaginationRowModel,
} from "@tanstack/react-table";
import { ClipboardIcon, EllipsisVertical } from "lucide-react";
import { useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";

import { DataTable } from "@/components/DataTable";
import ApplicantRolePill from "@/components/role-pill/RolePill";
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

import type { DecisionRow } from "./useRows";
import { useRows } from "./useRows";

type AcceptanceConfirmationTableProps = {
  confirmations: DecisionConfirmation[];
  search: string;
  rowCount?: number;
  decisionFilter: "all" | "accepted" | "denied";
  formId: string;
};

export default function AcceptanceConfirmationTable({
  confirmations,
  search,
  rowCount = 20,
  decisionFilter = "all",
  formId,
}: AcceptanceConfirmationTableProps) {
  const navigate = useNavigate();

  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: rowCount,
  });

  const columnHelper = createColumnHelper<DecisionRow>();
  const cols = useMemo(
    () =>
      [
        columnHelper.accessor("index", {
          id: "number",
          header: ({ column }) => (
            <SortableHeader column={column}>No.</SortableHeader>
          ),
          cell: ({ getValue }) => getValue(),
        }),
        columnHelper.accessor("applicant.name", {
          id: "applicant",
          header: ({ column }) => (
            <SortableHeader column={column}>Applicant</SortableHeader>
          ),
          cell: ({ getValue, row }) => {
            const email = row.original.applicant.email;
            return (
              <span className="flex items-center gap-2">
                <span>{getValue()}</span>
                <Tooltip>
                  <TooltipTrigger>
                    <ClipboardIcon
                      className="hover:bg-gray-100 rounded p-1 cursor-pointer"
                      size={18}
                      onClick={async () => {
                        try {
                          await navigator.clipboard.writeText(email);
                          throwSuccessToast(`${email} copied to clipboard!`);
                        } catch (err) {
                          console.error(err);
                          throwErrorToast("Failed to copy email");
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
            <SortableHeader column={column}>Role</SortableHeader>
          ),
          cell: ({ getValue }) => <ApplicantRolePill role={getValue()} />,
        }),
        columnHelper.accessor("decision", {
          id: "decision",
          header: ({ column }) => (
            <SortableHeader column={column}>Decision</SortableHeader>
          ),
          cell: ({ getValue }) => {
            const decision = getValue();
            const colorMap: Record<string, string> = {
              accepted: "bg-green-100 text-green-800",
              denied: "bg-red-100 text-red-800",
            };

            const display = decision ? decision.toUpperCase() : "N/A";

            const style =
              decision && colorMap[decision]
                ? colorMap[decision]
                : "bg-gray-100 text-gray-800";

            return (
              <span
                className={`px-2 py-1 rounded-full text-xs font-semibold ${style}`}
              >
                {display}
              </span>
            );
          },
          filterFn: (row, columnId, filterValue) => {
            const value = row.getValue(columnId) as "accepted" | "denied";

            if (filterValue === "all") return true;
            else if (filterValue === "accepted") return value === "accepted";
            else if (filterValue === "denied") return value === "denied";
            else return true;
          },
        }),
        columnHelper.display({
          id: "actions",
          header: () => (
            <div className="flex justify-center">
              <span className="text-center mx-auto">Actions</span>
            </div>
          ),
          cell: ({ row }) => (
            <div className="flex justify-center">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost">
                    <EllipsisVertical />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem
                    className="cursor-pointer"
                    onClick={() =>
                      navigate(
                        `/admin/board/application/${formId}/${row.original.responseId}`,
                      )
                    }
                  >
                    View Application
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ),
        }),
      ] as ColumnDef<DecisionRow>[],
    [columnHelper, formId, navigate],
  );

  const { data: rows, isPending, error } = useRows(confirmations, formId);

  const handleCopy = useCallback(async () => {
    if (!rows) {
      throwErrorToast("No applicants found!");
      return;
    }

    const emails = new Set(rows.map((r) => r.applicant.email));
    const text = [...emails].join(",");

    try {
      await navigator.clipboard.writeText(text);
      throwSuccessToast(`Copied ${emails.size} email(s)!`);
    } catch (err) {
      console.error("Failed to copy emails: ", err);
      throwErrorToast("Failed to copy emails");
    }
  }, [rows]);

  if (isPending) return <p>Loading...</p>;
  if (error) return <p>Something went wrong: {error.message}</p>;

  return (
    <div className="flex flex-col w-full gap-2">
      <div className="mt-2 flex items-end">
        <Button
          className="ml-auto"
          disabled={!rows || rows.length === 0}
          variant="outline"
          onClick={() => handleCopy()}
        >
          <ClipboardIcon /> Copy all applicant emails
        </Button>
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
                id: "decision",
                value: decisionFilter,
              },
            ],
          },
        }}
      />

      <div className="flex flex-row gap-2">
        <span>
          Page {pagination.pageIndex + 1} of{" "}
          {Math.max(Math.ceil(confirmations.length / rowCount), 1)}
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
              (pagination.pageIndex + 1) * rowCount >= confirmations.length
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
