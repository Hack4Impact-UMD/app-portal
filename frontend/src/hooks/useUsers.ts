import { queryOptions, skipToken, useQuery } from "@tanstack/react-query";

import { getAllUsers, getUserById } from "@/services/userService";

const userRoot = "users" as const;

export const userQueries = {
  root: [userRoot] as const,
  all: queryOptions({
    queryKey: [userRoot, "all"] as const,
    queryFn: () => getAllUsers(),
  }),
  detail: (id?: string) =>
    queryOptions({
      queryKey: [userRoot, "id", id] as const,
      queryFn: id ? () => getUserById(id) : skipToken,
    }),
};

export function useUsers(enabled = true) {
  return useQuery({ ...userQueries.all, enabled });
}

export function useUser(id: string) {
  return useQuery(userQueries.detail(id));
}
