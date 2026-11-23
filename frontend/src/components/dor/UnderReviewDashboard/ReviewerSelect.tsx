import { PermissionRole } from "@app-portal/shared/constants";
import type { ApplicantRole } from "@app-portal/shared/constants";
import type {
  AppReviewAssignment,
  ApplicationReviewData,
} from "@app-portal/shared/types";
import { skipToken, useQuery } from "@tanstack/react-query";
import { useCallback, useMemo, useState } from "react";
import { useParams } from "react-router-dom";

import ApplicantRolePill from "@/components/role-pill/RolePill";
import Spinner from "@/components/Spinner";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { trpc } from "@/config/trpc";
import { useReviewersForRole } from "@/hooks/useReviewers";
import { reviewingFor } from "@/services/reviewersService";
import type { ReviewCapableUser } from "@/types/types";

type ReviewerSelectProps = {
  onAdd: (reviewer: ReviewCapableUser) => void;
  onDelete: (
    reviewer: ReviewCapableUser,
    assignment: AppReviewAssignment,
  ) => void;
  role: ApplicantRole;
  reviewers: ReviewCapableUser[];
  assignments: AppReviewAssignment[];
  responseId: string;
  disabled?: boolean;
  reviews: ApplicationReviewData[];
};

type ReviewerSearchPopoverProps = {
  role: ApplicantRole;
  onSelect: (reviewer: ReviewCapableUser) => void;
  responseId: string;
};

function ReviewerSearchPopover({
  role,
  responseId,
  onSelect,
}: ReviewerSearchPopoverProps) {
  const { formId } = useParams<{ formId: string }>();

  const { data: reviewers, isPending, error } = useReviewersForRole(role);
  const assignments = useQuery(
    trpc.reviewAssignments.list.queryOptions(formId ? { formId } : skipToken),
  );

  const countByReviewer = useMemo(() => {
    const counts = new Map<string, number>();
    for (const a of assignments.data ?? []) {
      counts.set(a.reviewerId, (counts.get(a.reviewerId) ?? 0) + 1);
    }
    return counts;
  }, [assignments.data]);

  const validReviewers = useMemo(() => {
    const assigned = new Set(
      assignments.data
        ?.filter(
          (a) => a.applicationResponseId === responseId && a.forRole === role,
        )
        .map((a) => a.reviewerId),
    );
    return reviewers?.filter((r) => !assigned.has(r.id));
  }, [reviewers, assignments.data, responseId, role]);

  if (isPending)
    return (
      <div className="flex items-center justify-center p-2 w-full">
        <Spinner />
      </div>
    );

  if (error)
    return (
      <div className="flex items-center justify-center p-2 w-full">
        <p>Failed to fetch reviewers: {error.message}</p>
      </div>
    );

  return (
    <Command>
      <CommandInput placeholder="Search Reviewers..." />
      <CommandList className="max-h-42 overflow-y-auto">
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup>
          {validReviewers?.map((reviewer) => {
            return (
              <CommandItem
                key={reviewer.id}
                value={`${reviewer.firstName} ${reviewer.lastName}`}
                className="cursor-pointer flex flex-col gap-1 items-start"
                onSelect={() => onSelect(reviewer)}
              >
                <p>
                  {reviewer.firstName} {reviewer.lastName}{" "}
                  {assignments.isPending ? (
                    <Spinner className="size-3 inline ml-2" />
                  ) : assignments.error ? (
                    "N/A"
                  ) : (
                    `(${countByReviewer.get(reviewer.id) ?? 0})`
                  )}
                </p>
                <div className="flex flex-wrap gap-1">
                  {reviewer.role === PermissionRole.SuperReviewer ? (
                    <span
                      className={`text-xs bg-lightblue text-blue rounded-full px-2 py-1 text-center flex items-center max-w-fit justify-center`}
                    >
                      All Roles
                    </span>
                  ) : (
                    reviewingFor(reviewer).map((role) => (
                      <ApplicantRolePill
                        key={role}
                        role={role}
                        className="text-xs"
                      />
                    ))
                  )}
                </div>
              </CommandItem>
            );
          })}
        </CommandGroup>
      </CommandList>
    </Command>
  );
}

export function ReviewerSelect({
  onAdd,
  onDelete,
  role,
  reviewers,
  responseId,
  disabled = false,
  assignments,
  reviews,
}: ReviewerSelectProps) {
  const [showPopover, setShowPopover] = useState(false);

  const complete = useCallback(
    (reviewer: ReviewCapableUser) => {
      return reviews.find(
        (review) =>
          review.submitted &&
          review.reviewerId === reviewer.id &&
          review.forRole === role,
      );
    },
    [reviews, role],
  );

  return (
    <div className="flex flex-wrap items-center gap-1 max-h-20 max-w-64 overflow-y-scroll no-scrollbar">
      {reviewers.map((reviewer, index) => (
        <div
          key={reviewer.id}
          className={`rounded-full border h-7 px-2 py-1 text-sm flex flex-row gap-1 items-center ${complete(reviewer) ? "bg-green-200 text-green-800 border-green-100" : "bg-muted"}`}
        >
          <span className="text-sm">
            {reviewer.firstName} {reviewer.lastName}
          </span>
          <Button
            disabled={disabled}
            variant="ghost"
            className="size-3 hover:bg-transparent"
            onClick={() => onDelete(reviewer, assignments[index])}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="size-3"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18 18 6M6 6l12 12"
              />
            </svg>
          </Button>
        </div>
      ))}
      <Popover open={showPopover} onOpenChange={setShowPopover}>
        <PopoverTrigger asChild>
          <Button
            variant="default"
            className="rounded-full text-sm h-7 font-normal p-0"
            disabled={disabled}
          >
            Assign
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="size-3"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 4.5v15m7.5-7.5h-15"
              />
            </svg>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="p-0 max-h-32">
          <ReviewerSearchPopover
            responseId={responseId}
            role={role}
            onSelect={onAdd}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
