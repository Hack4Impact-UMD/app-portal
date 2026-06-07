import { queryOptions, useQuery } from "@tanstack/react-query";

import {
  getLatestDeployedCommit,
  getUpdateCheck,
} from "@/services/githubService";

const localCommit: string = import.meta.env.VITE_COMMIT;

const updateCheckRoot = "update-check" as const;
const commitRoot = "commit" as const;

export const githubQueries = {
  byLocalCommit: queryOptions({
    queryKey: [updateCheckRoot, localCommit] as const,
    queryFn: () => getUpdateCheck(localCommit),
  }),
  byRemoteCommit: queryOptions({
    queryKey: [commitRoot, "remote"] as const,
    queryFn: getLatestDeployedCommit,
  }),
};

export function useUpdateCheck() {
  return useQuery({
    ...githubQueries.byLocalCommit,
    refetchInterval: 5 * 60 * 1000,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: true,
  });
}

export function useRemoteCommit() {
  return useQuery(githubQueries.byRemoteCommit);
}
