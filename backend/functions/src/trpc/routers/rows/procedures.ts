import { PermissionRole } from "@app-portal/shared/constants";

import { REVIEW_CAPABLE_ROLES } from "../../../models/user";
import { roleProcedure } from "../../init";

export const superReviewerProcedure = roleProcedure([
  PermissionRole.SuperReviewer,
]);
export const reviewCapableProcedure = roleProcedure(REVIEW_CAPABLE_ROLES);
export const boardProcedure = roleProcedure([
  PermissionRole.Board,
  PermissionRole.SuperReviewer,
]);
