import type { ApplicantRole } from "@app-portal/shared/constants";
import type {
  DecisionConfirmation,
  InternalApplicationStatus,
} from "@app-portal/shared/types";
import { useQuery } from "@tanstack/react-query";

import { getApplicantById } from "@/services/applicantService";
import { getApplicationStatusById } from "@/services/statusService";

export type DecisionRow = {
  index: number;
  applicant: {
    id: string;
    name: string;
    email: string;
  };
  role: ApplicantRole;
  decision: "accepted" | "denied";
  responseId: string;
};

const acceptanceConfirmationRowsQueryRoot = [
  "acceptance-confirmation-rows",
] as const;

export function useRows(confirmations: DecisionConfirmation[], formId: string) {
  return useQuery({
    queryKey: [
      ...acceptanceConfirmationRowsQueryRoot,
      confirmations.map((a) => a.userId).sort(),
      formId,
    ],
    placeholderData: (prev) => prev,
    queryFn: async () => {
      return Promise.all(
        confirmations.map(async (conf, index) => {
          const applicant = await getApplicantById(conf.userId);

          // Get internal status
          const status: InternalApplicationStatus | undefined =
            await getApplicationStatusById(conf.internalStatusId);
          if (status === undefined) {
            throw new Error("Invalid status!");
          }

          // Build row for the table
          const row: DecisionRow = {
            index: index + 1,
            applicant: {
              id: applicant.id,
              name: `${applicant.firstName} ${applicant.lastName}`,
              email: applicant.email,
            },
            role: status.role,
            decision: conf.status,
            responseId: conf.responseId,
          };

          return row;
        }),
      );
    },
  });
}
