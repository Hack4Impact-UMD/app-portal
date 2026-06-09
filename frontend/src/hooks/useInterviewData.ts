import type { ApplicationInterviewData } from "@app-portal/shared/types";
import {
  queryOptions,
  skipToken,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import { throwErrorToast } from "@/components/toasts/ErrorToast";
import {
  getInterviewDataById,
  getInterviewDataForResponse,
  getInterviewDataForForm,
  updateInterviewData,
  getInterviewDataForInterviewer,
} from "@/services/interviewDataService";

import { useAuth } from "./useAuth";

const interviewDataRoot = "interview-data" as const;

const interviewDataQueries = {
  root: [interviewDataRoot] as const,
  detail: (id?: string) =>
    queryOptions({
      queryKey: [interviewDataRoot, "id", id] as const,
      queryFn: id ? () => getInterviewDataById(id) : skipToken,
    }),
  byApplicationResponse: (applicationResponseId?: string) =>
    queryOptions({
      queryKey: [
        interviewDataRoot,
        "application-response",
        applicationResponseId,
      ] as const,
      queryFn: applicationResponseId
        ? () => getInterviewDataForResponse(applicationResponseId)
        : skipToken,
    }),
  byForm: (formId?: string) =>
    queryOptions({
      queryKey: [interviewDataRoot, "form", formId] as const,
      queryFn: formId ? () => getInterviewDataForForm(formId) : skipToken,
    }),
  byInterviewer: (formId?: string, interviewerId?: string) =>
    queryOptions({
      queryKey: [
        interviewDataRoot,
        "interviewer",
        "interviewer-id",
        interviewerId,
        "form",
        formId,
      ] as const,
      queryFn:
        formId && interviewerId
          ? () => getInterviewDataForInterviewer(formId, interviewerId)
          : skipToken,
    }),
  mine: (formId?: string, interviewerId?: string) =>
    queryOptions({
      queryKey: [
        interviewDataRoot,
        "me",
        "interviewer",
        interviewerId,
        "form",
        formId,
      ] as const,
      queryFn:
        formId && interviewerId
          ? () => getInterviewDataForInterviewer(formId, interviewerId)
          : skipToken,
    }),
};

export function useInterviewData(interviewDataId?: string) {
  return useQuery(interviewDataQueries.detail(interviewDataId));
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
      const interviewDataKey =
        interviewDataQueries.detail(interviewDataId).queryKey;

      await queryClient.cancelQueries({
        queryKey: interviewDataKey,
      });
      const previousData =
        queryClient.getQueryData<ApplicationInterviewData>(interviewDataKey);
      queryClient.setQueryData<ApplicationInterviewData>(
        interviewDataKey,
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
        interviewDataQueries.detail(interviewDataId).queryKey,
        context?.previousData,
      );
      throwErrorToast("Failed to update interview!");
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: interviewDataQueries.detail(interviewDataId).queryKey,
      });
    },
  });
}

export function useInterviewDataForResponse(applicationResponseId?: string) {
  return useQuery(
    interviewDataQueries.byApplicationResponse(applicationResponseId),
  );
}

export function useInterviewDataForForm(formId?: string) {
  return useQuery(interviewDataQueries.byForm(formId));
}

export function useInterviewDataForInterviewer(
  formId?: string,
  interviewerId?: string,
) {
  return useQuery(interviewDataQueries.byInterviewer(formId, interviewerId));
}

export function useMyInterviews(formId: string) {
  const { user } = useAuth();
  return useQuery(interviewDataQueries.mine(formId, user?.id));
}
