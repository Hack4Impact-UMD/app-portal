import { PermissionRole } from "@app-portal/shared/constants";
import type { ApplicantRole } from "@app-portal/shared/constants";

import type { BoardUserProfile } from "@/types/types";

import { getUserById } from "./userService";

export async function getBoardMemberById(
  id: string,
): Promise<BoardUserProfile> {
  const user = await getUserById(id);
  if (user.role === PermissionRole.Board) {
    const boardUser: BoardUserProfile = {
      ...user,
      applicantRoles: user.applicantRoles ?? [],
    };
    return boardUser;
  } else {
    throw new Error("user is not a board member");
  }
}

export async function getApplicantRolesForBoardMember(
  boardId: string,
): Promise<ApplicantRole[]> {
  const user = await getUserById(boardId);
  if (user.role === PermissionRole.Board) {
    return (user as BoardUserProfile).applicantRoles ?? [];
  } else {
    throw new Error("user is not a board member");
  }
}
