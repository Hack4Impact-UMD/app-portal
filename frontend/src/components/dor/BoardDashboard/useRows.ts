import type { ApplicantRole } from "@app-portal/shared/constants";
import { useQuery } from "@tanstack/react-query";

import type { BoardUserProfile } from "@/types/types";

export type BoardRow = {
  index: number;
  boardMember: {
    name: string;
    id: string;
    email: string;
  };
  applicantRoles: ApplicantRole[];
};

export const boardRowsQueryRoot = ["board-rows"] as const;

export function useRows(boardMembers: BoardUserProfile[]) {
  return useQuery({
    queryKey: [
      ...boardRowsQueryRoot,
      boardMembers
        .map((b) => `${b.id}-${(b.applicantRoles ?? []).sort().join(",")}`)
        .sort(),
    ],
    placeholderData: (prev) => prev,
    queryFn: async () =>
      Promise.all(
        boardMembers.map(async (boardMember, index) => {
          const row: BoardRow = {
            index: 1 + index,
            boardMember: {
              id: boardMember.id,
              name: `${boardMember.firstName} ${boardMember.lastName}`,
              email: boardMember.email,
            },
            applicantRoles: boardMember.applicantRoles ?? [],
          };

          return row;
        }),
      ),
  });
}
