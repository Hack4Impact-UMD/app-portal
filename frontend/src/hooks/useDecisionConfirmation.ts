import type { DecisionConfirmation } from "@app-portal/shared/types";
import { useQuery } from "@tanstack/react-query";

import {
  getAllDecisionConfirmationsByFormId,
  getDecisionConfirmationForResponseRole,
} from "@/services/decisionConfirmationService";

import { useAuth } from "./useAuth";

export function useAllDecisionConfirmationsForForm(formId: string | undefined) {
  return useQuery<DecisionConfirmation[]>({
    queryKey: ["decision-confirmation", "form", formId],
    enabled: !!formId,
    queryFn: () => {
      if (!formId) throw new Error("formId is required");
      return getAllDecisionConfirmationsByFormId(formId);
    },
  });
}

export function useDecisionConfirmationForResponse(
  responseId: string | undefined,
) {
  const { user } = useAuth();
  return useQuery<DecisionConfirmation | null>({
    queryKey: ["decision-confirmation", "response", responseId],
    enabled: !!responseId && !!user,
    queryFn: () => {
      if (!responseId) throw new Error("responseId is required");
      return getDecisionConfirmationForResponseRole(user!.id, responseId);
    },
  });
}
