import type { ApplicantRole } from "@app-portal/shared/constants";
import { getApplicantById } from "@/services/applicantService";
import { getApplicationStatusById } from "@/services/statusService";
import type {
  DecisionLetterStatus,
  InternalApplicationStatus,
} from "@/types/types";
import { useQuery } from "@tanstack/react-query";

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

export function useRows(confirmations: DecisionLetterStatus[], formId: string) {
  return useQuery({
    queryKey: [
      "confirmation-rows",
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
