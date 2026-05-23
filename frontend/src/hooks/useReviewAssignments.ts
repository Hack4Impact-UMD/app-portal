import type { AppReviewAssignment } from "@app-portal/shared/types";
import {
  getReviewAssignments,
  getReviewAssignmentsForApplication,
  getReviewAssignmentsForForm,
} from "@/services/reviewAssignmentService";

import { useQuery } from "@tanstack/react-query";
import { useAuth } from "./useAuth";

export function useReviewAssignments(formId: string, reviewerId: string) {
  return useQuery<AppReviewAssignment[]>({
    queryKey: ["review-assignments", "id", formId, reviewerId],
    queryFn: () => getReviewAssignments(formId, reviewerId),
  });
}

export function useReviewAssignmentsForForm(formId: string) {
  return useQuery<AppReviewAssignment[]>({
    queryKey: ["review-assignments", "form", formId],
    queryFn: () => getReviewAssignmentsForForm(formId),
  });
}

export function useMyReviewAssignments(formId: string) {
  const { user } = useAuth();

  return useQuery<AppReviewAssignment[]>({
    queryKey: ["review-assignments", "me", formId],
    enabled: user ? true : false,
    queryFn: () => getReviewAssignments(formId, user!.id),
  });
}

export function useReviewAssignmentsForResponse(responseId: string) {
  return useQuery<AppReviewAssignment[]>({
    queryKey: ["review-assignments", "response", responseId],
    enabled: !!responseId,
    queryFn: () => getReviewAssignmentsForApplication(responseId),
  });
}
