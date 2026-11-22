import { PermissionRole } from "@app-portal/shared/constants";

import { roleProcedure } from "../../init";
import { REVIEW_CAPABLE_ROLES } from "./helpers";

export const superReviewerProcedure = roleProcedure([
  PermissionRole.SuperReviewer,
]);
export const reviewCapableProcedure = roleProcedure(REVIEW_CAPABLE_ROLES);
