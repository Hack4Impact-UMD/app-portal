import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { trpc } from "@/config/trpc";
import type { RouterOutputs } from "@/types/trpc";

export type BoardRow = RouterOutputs["rows"]["boardMembers"][number];

export const boardRowsQueryRoot = trpc.rows.boardMembers.pathKey();

export function useRows() {
  return useQuery(
    trpc.rows.boardMembers.queryOptions(undefined, {
      placeholderData: keepPreviousData,
    }),
  );
}
