import { PermissionRole } from "@app-portal/shared/constants";
import { useQuery } from "@tanstack/react-query";

import { trpc } from "@/config/trpc";

export function useBoardRoles(boardId: string) {
  return useQuery(
    trpc.users.get.queryOptions(
      { id: boardId },
      {
        select: (user) => {
          if (user.role !== PermissionRole.Board) {
            throw new Error("user is not a board member");
          }
          return user.applicantRoles ?? [];
        },
      },
    ),
  );
}
