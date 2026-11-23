import type { InternalApplicationStatus } from "@app-portal/shared/types";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { listConfirmationsForForm } from "../../../services/decisions";
import { getStatusesByIds } from "../../../services/statuses";
import { getUsers } from "../../../services/users";
import { requireUser } from "./helpers";
import { superReviewerProcedure } from "./procedures";

export const acceptanceConfirmations = superReviewerProcedure
  .input(z.object({ formId: z.string() }))
  .query(async ({ input: { formId } }) => {
    const confirmations = await listConfirmationsForForm(formId);

    const [applicants, statuses] = await Promise.all([
      getUsers(confirmations.map((c) => c.userId)),
      getStatusesByIds(confirmations.map((c) => c.internalStatusId)),
    ]);

    const statusById = new Map<string, InternalApplicationStatus>();
    for (const status of statuses) {
      if (!statusById.has(status.id)) statusById.set(status.id, status);
    }

    return confirmations.map((conf, index) => {
      const applicant = requireUser(applicants, conf.userId);
      const status = statusById.get(conf.internalStatusId);
      if (status === undefined) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Invalid status!",
        });
      }

      return {
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
    });
  });
