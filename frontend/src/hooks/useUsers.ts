import { useQuery } from "@tanstack/react-query";

import { trpc } from "@/config/trpc";

export function useUsers(enabled = true) {
  return useQuery({ ...trpc.users.list.queryOptions(), enabled });
}

export function useUser(id: string) {
  return useQuery(trpc.users.get.queryOptions({ id }));
}
