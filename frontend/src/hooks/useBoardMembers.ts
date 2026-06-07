import { queryOptions, skipToken, useQuery } from "@tanstack/react-query";

import {
  getAllBoardMembers,
  getApplicantRolesForBoardMember,
} from "@/services/boardService";

const boardMemberRoot = "board-members" as const;

export const boardMemberQueries = {
  root: [boardMemberRoot] as const,
  all: queryOptions({
    queryKey: [boardMemberRoot] as const,
    queryFn: () => getAllBoardMembers(),
  }),
  roles: (boardId?: string) =>
    queryOptions({
      queryKey: [boardMemberRoot, "boardId", boardId] as const,
      queryFn: boardId
        ? () => getApplicantRolesForBoardMember(boardId)
        : skipToken,
    }),
};

export function useAllBoardMembers() {
  return useQuery(boardMemberQueries.all);
}

export function useBoardRoles(boardId: string) {
  return useQuery(boardMemberQueries.roles(boardId));
}
