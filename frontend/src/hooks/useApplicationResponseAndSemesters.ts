import { queryOptions, skipToken, useQuery } from "@tanstack/react-query";

import { getApplicationResponseAndSemester } from "@/services/applicationResponseAndSemesterService";

import { useAuth } from "./useAuth";

const applicationResponseAndSemesterRoot = "responses-and-semester" as const;

export const applicationResponseAndSemesterQueries = {
  root: [applicationResponseAndSemesterRoot] as const,
  byUser: (userId?: string) =>
    queryOptions({
      queryKey: [applicationResponseAndSemesterRoot, userId] as const,
      queryFn: userId
        ? () => getApplicationResponseAndSemester(userId)
        : skipToken,
    }),
};

export function useApplicationResponsesAndSemesters() {
  const { user, isAuthed, isLoading } = useAuth();

  return useQuery({
    ...applicationResponseAndSemesterQueries.byUser(user?.id),
    enabled: !isLoading && isAuthed,
    initialData: [],
  });
}
