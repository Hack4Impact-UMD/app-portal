import { queryOptions, skipToken, useQuery } from "@tanstack/react-query";

import { getApplicantRolesForBoardMember } from "@/services/boardService";

import { userQueries } from "./useUsers";

const boardMemberRoot = [...userQueries.root, "board-members"] as const;

export const boardMemberQueries = {
  root: boardMemberRoot,
  roles: (boardId?: string) =>
    queryOptions({
      queryKey: [...boardMemberRoot, "id", boardId] as const,
      queryFn: boardId
        ? () => getApplicantRolesForBoardMember(boardId)
        : skipToken,
    }),
};

export function useBoardRoles(boardId: string) {
  return useQuery(boardMemberQueries.roles(boardId));
}
