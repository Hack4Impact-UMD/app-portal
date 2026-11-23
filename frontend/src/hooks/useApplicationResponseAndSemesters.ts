import { useQuery } from "@tanstack/react-query";

import { trpc } from "@/config/trpc";

import { useAuth } from "./useAuth";

export function useApplicationResponsesAndSemesters() {
  const { isAuthed, isLoading } = useAuth();

  return useQuery({
    ...trpc.application.mineWithSemester.queryOptions(),
    enabled: !isLoading && isAuthed,
    initialData: [],
  });
}
