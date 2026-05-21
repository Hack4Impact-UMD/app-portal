import type { ApplicantRole } from "@app-portal/shared/types";
import { db } from "@/config/firebase";
import type { BoardUserProfile } from "@/types/types";
import { PermissionRole } from "@/types/types";
import { collection, getDocs, query, where } from "firebase/firestore";
import { getUserById } from "./userService";

const USERS_COLLECTION = "users";

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
  const users = collection(db, USERS_COLLECTION);
  const q = query(users, where("role", "==", PermissionRole.Board));

  return (await getDocs(q)).docs
    .map((d) => d.data() as BoardUserProfile)
    .map(
      (b: BoardUserProfile): BoardUserProfile => ({
        ...b,
        applicantRoles: b.applicantRoles ?? [],
      }),
    );
}
