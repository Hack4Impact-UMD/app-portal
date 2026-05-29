import { useQuery } from "@tanstack/react-query";

import { getAllUsers, getUserById } from "@/services/userService";
import type { UserProfile } from "@/types/types";

export function useUsers() {
  return useQuery<UserProfile[]>({
    queryKey: ["users", "all"],
    queryFn: () => getAllUsers(),
  });
}

export function useUser(id: string) {
  return useQuery<UserProfile>({
    queryKey: ["users", "id", id],
    enabled: !!id,
    queryFn: () => getUserById(id),
  });
}
