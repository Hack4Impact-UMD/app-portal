import { useQuery } from "@tanstack/react-query";

import { getLatestDeployedCommit } from "@/services/githubService";

const localCommit = import.meta.env.VITE_COMMIT;

export function useUpdateCheck() {
  return useQuery<boolean>({
    queryKey: ["update-check", localCommit],
    queryFn: async () => {
      if (!localCommit || localCommit === "dev") {
        console.warn("Skipping update check (dev environment)");
        return false;
      }

      const remoteCommit = await getLatestDeployedCommit();

      if (remoteCommit && remoteCommit !== localCommit) {
        console.log(
          `New version available. Local: ${localCommit}, Remote: ${remoteCommit}`,
        );
        return true;
      }
      return false;
    },
    refetchInterval: 5 * 60 * 1000,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: true,
  });
}

export function useRemoteCommit() {
  return useQuery<string | null>({
    queryKey: ["commit", "remote"],
    queryFn: getLatestDeployedCommit,
  });
}
