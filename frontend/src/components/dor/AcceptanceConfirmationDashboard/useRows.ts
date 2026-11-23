import { keepPreviousData, skipToken, useQuery } from "@tanstack/react-query";

import { trpc } from "@/config/trpc";
import type { RouterOutputs } from "@/types/trpc";

export type DecisionRow =
  RouterOutputs["rows"]["acceptanceConfirmations"][number];

export function useRows(formId: string | undefined) {
  return useQuery(
    trpc.rows.acceptanceConfirmations.queryOptions(
      formId ? { formId } : skipToken,
      { placeholderData: keepPreviousData },
    ),
  );
}
