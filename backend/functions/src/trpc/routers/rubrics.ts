import {
  ApplicantRole,
  FirestoreCollection,
} from "@app-portal/shared/constants";
import { z } from "zod";

import { appCollection } from "../../utils/firestore";
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
      const collection =
        kind === "review"
          ? FirestoreCollection.Rubrics
          : FirestoreCollection.InterviewRubrics;

      const rubrics = (
        await appCollection(collection).where("formId", "==", formId).get()
      ).docs.map((d) => d.data());

      if (!role) return rubrics;
      return rubrics.filter(
        (r) => r.roles.length === 0 || r.roles.includes(role),
      );
    }),
});
