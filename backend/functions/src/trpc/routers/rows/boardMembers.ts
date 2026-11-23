import {
  FirestoreCollection,
  PermissionRole,
} from "@app-portal/shared/constants";

import { appCollection } from "../../../utils/firestore";
import { superReviewerProcedure } from "./procedures";

export const boardMembers = superReviewerProcedure.query(async () => {
  const boardMembers = (
    await appCollection(FirestoreCollection.Users)
      .where("role", "==", PermissionRole.Board)
      .get()
  ).docs.map((d) => d.data());

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
