import {
  FirestoreCollection,
  PermissionRole,
} from "@app-portal/shared/constants";
import type { ApplicantRole } from "@app-portal/shared/constants";
import { getDocs, query, where } from "firebase/firestore";

import type { BoardUserProfile } from "@/types/types";

import { appCollection } from "./firestore";
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

export async function getAllBoardMembers(): Promise<BoardUserProfile[]> {
  const users = appCollection(FirestoreCollection.Users);
  const q = query(users, where("role", "==", PermissionRole.Board));

  return (await getDocs(q)).docs
    .map((d) => d.data() as BoardUserProfile)
    .map((b) => ({
      ...b,
      applicantRoles: b.applicantRoles ?? [],
    }));
}
