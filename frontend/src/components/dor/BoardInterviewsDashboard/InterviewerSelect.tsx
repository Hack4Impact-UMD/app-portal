import type {
  InterviewAssignment,
  ApplicationInterviewData,
} from "@app-portal/shared/types";
import type { ApplicantRole } from "@app-portal/shared/constants";
import ApplicantRolePill from "@/components/role-pill/RolePill";
import Spinner from "@/components/Spinner";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { useReviewersForRole } from "@/hooks/useReviewers";
import { getInterviewAssignmentsForApplication } from "@/services/interviewAssignmentService";
import type { ReviewCapableUser } from "@/types/types";
import { PermissionRole } from "@/types/types";
import { useQuery } from "@tanstack/react-query";
import { useCallback, useMemo, useState } from "react";
import { reviewingFor } from "@/services/reviewersService";

function InterviewerSearchPopover({
  role,
  responseId,
  onSelect,
}: {
  role: ApplicantRole;
  responseId: string;
  onSelect: (interviewer: ReviewCapableUser) => void;
}) {
  const {
    data: interviewers,
    isPending: interviewersPending,
    error: interviewersError,
  } = useReviewersForRole(role);
  const {
    data: allAssignments,
    isPending: assignmentsPending,
    error: assignmentsError,
  } = useQuery({
    queryKey: ["interview-assignments", responseId],
    queryFn: () => getInterviewAssignmentsForApplication(responseId),
  });

  const validInterviewers = useMemo(() => {
    if (!interviewers || !allAssignments) {
      return [];
    }
    const assignmentsForRole = allAssignments.filter((a) => a.forRole === role);
    const assignedIds = new Set(assignmentsForRole.map((a) => a.interviewerId));
    return interviewers.filter((i) => !assignedIds.has(i.id));
  }, [interviewers, allAssignments, role]);

  const isPending = interviewersPending || assignmentsPending;
  const error = interviewersError || assignmentsError;

  if (isPending)
    return (
      <div className="flex items-center justify-center p-2 w-full">
        <Spinner />
      </div>
    );
  if (error)
    return (
      <div className="flex items-center justify-center p-2 w-full">
        <p>Failed to fetch data: {error.message}</p>
      </div>
    );
  return (
    <Command>
      <CommandInput placeholder="Search Interviewers..." />
      <CommandList className="max-h-42 overflow-y-auto">
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup>
          {validInterviewers?.map((interviewer) => (
            <CommandItem
              key={interviewer.id}
              value={`${interviewer.firstName} ${interviewer.lastName}`}
              className="cursor-pointer flex flex-col gap-1 items-start"
              onSelect={() => onSelect(interviewer)}
            >
              <p>
                {interviewer.firstName} {interviewer.lastName}
              </p>
              <div className="flex flex-wrap gap-1">
                {interviewer.role === PermissionRole.SuperReviewer ? (
                  <span
                    className={`text-xs bg-lightblue text-blue rounded-full px-2 py-1 text-center flex items-center max-w-fit justify-center`}
                  >
                    All Roles
                  </span>
                ) : (
                  reviewingFor(interviewer).map((role) => (
                    <ApplicantRolePill
                      key={role}
                      role={role}
                      className="text-xs"
                    />
                  ))
                )}
              </div>
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </Command>
  );
}

export function InterviewerSelect({
  onAdd,
  onDelete,
  role,
  interviewers,
  assignments,
  responseId,
  disabled = false,
  interviews,
}: {
  onAdd: (interviewer: ReviewCapableUser) => void;
  onDelete: (
    interviewer: ReviewCapableUser,
    assignment: InterviewAssignment,
  ) => void;
  role: ApplicantRole;
  interviewers: ReviewCapableUser[];
  assignments: InterviewAssignment[];
  responseId: string;
  disabled?: boolean;
  interviews: ApplicationInterviewData[];
}) {
  const [showPopover, setShowPopover] = useState(false);
  // Check if interview is complete for a given interviewer
  const complete = useCallback(
    (interviewer: ReviewCapableUser) => {
      return interviews.find(
        (interview) =>
          interview.submitted &&
          interview.interviewerId === interviewer.id &&
          interview.forRole === role,
      );
    },
    [interviews, role],
  );
  return (
    <div className="flex flex-wrap items-center gap-1 max-h-20 max-w-64 overflow-y-scroll no-scrollbar">
      {interviewers.map((interviewer, index) => (
        <div
          key={interviewer.id}
          className={`rounded-full border h-7 px-2 py-1 text-sm flex flex-row gap-1 items-center ${complete(interviewer) ? "bg-green-200 text-green-800 border-green-100" : "bg-muted"}`}
        >
          <span className="text-sm">
            {interviewer.firstName} {interviewer.lastName}
          </span>
          <Button
            disabled={disabled}
            variant="ghost"
            className="size-3 hover:bg-transparent"
            onClick={() => onDelete(interviewer, assignments[index])}
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
          <InterviewerSearchPopover
            responseId={responseId}
            role={role}
            onSelect={onAdd}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
