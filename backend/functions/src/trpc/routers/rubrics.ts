import { ApplicantRole } from "@app-portal/shared/constants";
import { z } from "zod";

import { listRubricsForForm } from "../../services/rubrics";
import { router } from "../init";
import { reviewCapableProcedure } from "./rows/procedures";

export const rubricsRouter = router({
  list: reviewCapableProcedure
    .input(
      z.object({
        formId: z.string().min(1),
        kind: z.enum(["review", "interview"]),
        role: z.enum(ApplicantRole).optional(),
      }),
    )
    .query(async ({ input: { formId, kind, role } }) => {
      const rubrics = await listRubricsForForm(kind, formId);
      if (!role) return rubrics;
      return rubrics.filter(
        (r) => r.roles.length === 0 || r.roles.includes(role),
      );
    }),
});
