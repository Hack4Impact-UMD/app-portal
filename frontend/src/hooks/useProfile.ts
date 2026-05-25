import { useQuery } from "@tanstack/react-query";

import { getUserById } from "@/services/userService";
import type { UserProfile } from "@/types/types";

export function useProfile(uid: string) {
  return useQuery<UserProfile>({
    queryKey: ["profile", uid],
    queryFn: async () => {
      return await getUserById(uid);
    },
  });
}
