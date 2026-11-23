import { PermissionRole } from "@app-portal/shared/constants";

import { listUsersByRole } from "../../../services/users";
import { superReviewerProcedure } from "./procedures";

export const boardMembers = superReviewerProcedure.query(async () => {
  const boardMembers = await listUsersByRole(PermissionRole.Board);

  return boardMembers.map((boardMember, index) => ({
    index: 1 + index,
    boardMember: {
      id: boardMember.id,
      name: `${boardMember.firstName} ${boardMember.lastName}`,
      email: boardMember.email,
    },
    applicantRoles:
      boardMember.role === PermissionRole.Board
        ? (boardMember.applicantRoles ?? [])
        : [],
  }));
});
