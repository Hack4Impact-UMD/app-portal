import { useMutation, useQueryClient } from "@tanstack/react-query";

import { throwErrorToast } from "@/components/toasts/ErrorToast";
import { throwSuccessToast } from "@/components/toasts/SuccessToast";
import {
  getAllForms,
  setApplicationFormActiveStatus,
} from "@/services/applicationFormsService";

import { formQueries } from "./useApplicationForm";

export function useUpdateApplicationFormActive() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      formId,
      active,
    }: {
      formId: string;
      active: boolean;
    }) => {
      await setApplicationFormActiveStatus(formId, active);

      if (active) {
        const otherForms = (await getAllForms()).filter((f) => f.id !== formId);
        await Promise.all(
          otherForms.map(
            async (f) => await setApplicationFormActiveStatus(f.id, false),
          ),
        );
      }
    },
    onError: (err) => {
      throwErrorToast("Failed to update form active status");
      console.error(err);
    },
    onSuccess: () => {
      throwSuccessToast("Form active status updated successfully!");
    },
    onSettled: async () => {
      await queryClient.invalidateQueries({ queryKey: formQueries.root });
    },
  });
}
