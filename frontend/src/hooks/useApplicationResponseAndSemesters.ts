import { useQuery } from "@tanstack/react-query";

import { getApplicationResponseAndSemester } from "@/services/applicationResponseAndSemesterService";

import { useAuth } from "./useAuth";

export function useApplicationResponsesAndSemesters() {
  const { user, isAuthed, isLoading } = useAuth();

  return useQuery({
    queryKey: ["responses-and-semester", user?.id],
    enabled: !isLoading && isAuthed,
    queryFn: () => {
      return getApplicationResponseAndSemester(user!.id);
    },
    initialData: [],
  });
}
