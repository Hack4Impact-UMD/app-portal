import type { ApplicationReviewData } from "@app-portal/shared/types";
import { useQueryClient } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import {
  createColumnHelper,
  getPaginationRowModel,
} from "@tanstack/react-table";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { DataTable } from "@/components/DataTable";
import ApplicantRolePill from "@/components/role-pill/RolePill";
import Spinner from "@/components/Spinner";
import SortableHeader from "@/components/tables/SortableHeader";
import { throwErrorToast } from "@/components/toasts/ErrorToast";
import { Button } from "@/components/ui/button";
import { trpc } from "@/config/trpc";

import type { AssignedAppRow } from "./useRows";
import { useRows } from "./useRows";

type AssignedReviewsTableProps = {
  search: string;
  responseId: string;
  rowCount?: number;
  statusFilter: "all" | "reviewed" | "pending";
  formId: string;
};

export default function AssignedReviewsTable({
  search,
  responseId,
  formId,
  rowCount = 20,
  statusFilter = "all",
}: AssignedReviewsTableProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: rowCount,
  });

  const columnHelper = createColumnHelper<AssignedAppRow>();
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
        columnHelper.accessor("reviewerName", {
          id: "reviewer",
          header: ({ column }) => {
            return <SortableHeader column={column}>REVIEWER</SortableHeader>;
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
        columnHelper.accessor("review", {
          id: "review-status",
          header: ({ column }) => {
            return <SortableHeader column={column}>ACTION</SortableHeader>;
          },
          cell: ({ getValue, row }) => {
            const review = getValue();
            const rowData = row.original;
            if (review?.submitted) {
              return (
                <Button
                  onClick={() => handleReview(review, rowData.responseId)}
                  variant="outline"
                  className="border-2 rounded-full"
                >
                  View Review
                </Button>
              );
            } else if (review) {
              return "Review In Progress";
            } else {
              return "Not Reviewed";
            }
          },
          filterFn: (row, columnId, filterValue) => {
            const value = row.getValue(columnId) as
              | ApplicationReviewData
              | undefined;

            if (filterValue === "all") return true;
            else if (filterValue === "pending")
              return !(value?.submitted ?? false);
            else if (filterValue === "reviewed")
              return value?.submitted ?? false;
            else return true;
          },
        }),
      ] as ColumnDef<AssignedAppRow>[],
    [columnHelper],
  );

  async function handleReview(
    appReviewData: ApplicationReviewData | undefined,
    responseId: string,
  ) {
    const form = await queryClient.fetchQuery(
      trpc.forms.get.queryOptions({ id: formId }),
    );
    if (appReviewData) {
      // there's an existing review, edit it
      navigate(
        `/admin/review/f/${appReviewData.applicationFormId}/${responseId}/${form.sections[0].sectionId}/${appReviewData.id}?edit=false`,
      );
    } else {
      throwErrorToast("Review data does not exist!");
    }
  }

  const { data: rows, isPending, error } = useRows(responseId);

  if (isPending || !rows)
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
          {Math.max(Math.ceil((rows?.length ?? 0) / rowCount), 1)}
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
              (pagination.pageIndex + 1) * rowCount >= (rows?.length ?? 0)
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
