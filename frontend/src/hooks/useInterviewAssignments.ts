import { queryOptions, skipToken, useQuery } from "@tanstack/react-query";

import {
  getInterviewAssignments,
  getInterviewAssignmentsForApplication,
  getInterviewAssignmentsForForm,
} from "@/services/interviewAssignmentService";

import { useAuth } from "./useAuth";

const interviewAssignmentRoot = "interview-assignments" as const;

export const interviewAssignmentQueries = {
  root: [interviewAssignmentRoot] as const,
  detail: (formId?: string, interviewerId?: string) =>
    queryOptions({
      queryKey: [
        interviewAssignmentRoot,
        "form",
        formId,
        "interviewer",
        interviewerId,
      ] as const,
      queryFn:
        formId && interviewerId
          ? () => getInterviewAssignments(formId, interviewerId)
          : skipToken,
    }),
  byForm: (formId?: string) =>
    queryOptions({
      queryKey: [interviewAssignmentRoot, "form", formId] as const,
      queryFn: formId
        ? () => getInterviewAssignmentsForForm(formId)
        : skipToken,
    }),
  mine: (formId: string, interviewerId?: string) =>
    queryOptions({
      queryKey: [
        interviewAssignmentRoot,
        "me",
        "form",
        formId,
        "interviewer",
        interviewerId,
      ] as const,
      queryFn: interviewerId
        ? () => getInterviewAssignments(formId, interviewerId)
        : skipToken,
    }),
  byResponse: (responseId?: string) =>
    queryOptions({
      queryKey: [interviewAssignmentRoot, "response", responseId] as const,
      queryFn: responseId
        ? () => getInterviewAssignmentsForApplication(responseId)
        : skipToken,
    }),
};

export function useInterviewAssignments(
  formId?: string,
  interviewerId?: string,
) {
  return useQuery(interviewAssignmentQueries.detail(formId, interviewerId));
}

export function useInterviewAssignmentsForForm(formId?: string) {
  return useQuery(interviewAssignmentQueries.byForm(formId));
}

export function useMyInterviewAssignments(formId: string) {
  const { user } = useAuth();

  return useQuery(interviewAssignmentQueries.mine(formId, user?.id));
}

export function useInterviewAssignmentsForResponse(responseId?: string) {
  return useQuery(interviewAssignmentQueries.byResponse(responseId));
}
