import type { ApplicantRole } from "@app-portal/shared/constants";
import { useQuery } from "@tanstack/react-query";

import {
  getAllBoardMembers,
  getApplicantRolesForBoardMember,
} from "@/services/boardService";
import type { BoardUserProfile } from "@/types/types";

export function useAllBoardMembers() {
  return useQuery<BoardUserProfile[]>({
    queryKey: ["board-members"],
    queryFn: () => getAllBoardMembers(),
  });
}

export function useBoardRoles(boardId: string) {
  return useQuery<ApplicantRole[]>({
    queryKey: ["board-members", "boardId", boardId],
    enabled: !!boardId,
    queryFn: () => getApplicantRolesForBoardMember(boardId),
  });
}
