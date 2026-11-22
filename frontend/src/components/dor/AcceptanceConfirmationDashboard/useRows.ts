import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { trpc } from "@/config/trpc";
import type { RouterOutputs } from "@/types/trpc";

export type DecisionRow =
  RouterOutputs["rows"]["acceptanceConfirmations"][number];

export function useRows(formId: string) {
  return useQuery(
    trpc.rows.acceptanceConfirmations.queryOptions(
      { formId },
      { placeholderData: keepPreviousData },
    ),
  );
}
