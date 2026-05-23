import type { ApplicationInterviewData } from "@app-portal/shared/types";
import { throwErrorToast } from "@/components/toasts/ErrorToast";
import {
  getInterviewDataById,
  getInterviewDataForResponse,
  getInterviewDataForForm,
  updateInterviewData,
  getInterviewDataForInterviewer,
} from "@/services/interviewDataService";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "./useAuth";

export function useInterviewData(interviewDataId: string) {
  return useQuery<ApplicationInterviewData>({
    queryKey: ["interview-data", "id", interviewDataId],
    enabled: !!interviewDataId,
    queryFn: () => getInterviewDataById(interviewDataId),
  });
}

export function useUpdateInterviewData(interviewDataId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (
      update: Partial<Omit<ApplicationInterviewData, "id">>,
    ) => {
      await updateInterviewData(interviewDataId, update);
    },
    onMutate: async (newData) => {
      await queryClient.cancelQueries({
        queryKey: ["interview-data", "id", interviewDataId],
      });
      const previousData = queryClient.getQueryData<ApplicationInterviewData>([
        "interview-data",
        "id",
        interviewDataId,
      ]);
      queryClient.setQueryData<ApplicationInterviewData>(
        ["interview-data", "id", interviewDataId],
        (old) => {
          if (!old) return undefined;
          return {
            ...old,
            ...newData,
          };
        },
      );
      return { previousData };
    },
    onError: (_err, _newData, context) => {
      queryClient.setQueryData(
        ["interview-data", "id", interviewDataId],
        context?.previousData,
      );
      throwErrorToast("Failed to update interview!");
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: ["interview-data", "id", interviewDataId],
      });
      queryClient.invalidateQueries({
        queryKey: ["score", "interview", interviewDataId],
      });
    },
  });
}

export function useInterviewDataForResponse(applicationResponseId: string) {
  return useQuery<ApplicationInterviewData[]>({
    queryKey: ["interview-data", "application-response", applicationResponseId],
    queryFn: () => {
      return getInterviewDataForResponse(applicationResponseId);
    },
  });
}

export function useInterviewDataForForm(formId: string) {
  return useQuery<ApplicationInterviewData[]>({
    queryKey: ["interview-data", "form", formId],
    enabled: !!formId,
    queryFn: () => getInterviewDataForForm(formId),
  });
}

export function useInterviewDataForInterviewer(
  formId: string,
  interviewerId: string,
) {
  return useQuery<ApplicationInterviewData[]>({
    queryKey: ["interview-data", "interviewer", formId, interviewerId],
    queryFn: () => {
      return getInterviewDataForInterviewer(formId, interviewerId);
    },
  });
}

export function useMyInterviews(formId: string) {
  const { user } = useAuth();
  return useQuery<ApplicationInterviewData[]>({
    queryKey: ["interview-data", "me", formId, user?.id],
    enabled: !!user,
    queryFn: () => getInterviewDataForInterviewer(formId, user!.id),
  });
}
