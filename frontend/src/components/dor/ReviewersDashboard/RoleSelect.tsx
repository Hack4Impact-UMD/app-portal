import { ApplicantRole } from "@app-portal/shared/types";
import Spinner from "@/components/Spinner";
import ApplicantRolePill from "@/components/role-pill/RolePill";
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
import { useRolePreferencesForReviewer } from "@/hooks/useReviewers";

import {
  applicantRoleColor,
  applicantRoleDarkColor,
  displayApplicantRoleName,
} from "@/utils/display";
import { useState } from "react";

type RoleSelectProps = {
  onAdd: (role: ApplicantRole, reviewerId: string) => void;
  onDelete: (role: ApplicantRole, reviewerId: string) => void;
  rolePreferences: ApplicantRole[];
  reviewerId: string;
  disabled?: boolean;
};

type RoleSearchPopoverProps = {
  reviewerId: string;
  onSelect: (role: ApplicantRole, reviewerId: string) => void;
};

function RoleSearchPopover({ reviewerId, onSelect }: RoleSearchPopoverProps) {
  const {
    data: rolePreferences,
    isPending,
    error,
  } = useRolePreferencesForReviewer(reviewerId);
  const roles = Object.values(ApplicantRole);

  if (isPending)
    return (
      <div className="flex items-center justify-center p-2 w-full">
        <Spinner />
      </div>
    );

  if (error)
    return (
      <div className="flex items-center justify-center p-2 w-full">
        <p>Failed to fetch role preferences: {error.message}</p>
      </div>
    );

  return (
    <Command>
      <CommandInput placeholder="Search Roles..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup>
          {roles
            ?.filter((r) => !rolePreferences.includes(r))
            .map((role) => {
              return (
                <CommandItem
                  key={role}
                  value={displayApplicantRoleName(role)}
                  className="cursor-pointer flex flex-col gap-1 items-start"
                  onSelect={() => onSelect(role, reviewerId)}
                >
                  <ApplicantRolePill role={role} />
                </CommandItem>
              );
            })}
        </CommandGroup>
      </CommandList>
    </Command>
  );
}

export function RoleSelect({
  onAdd,
  onDelete,
  rolePreferences,
  reviewerId,
  disabled = false,
}: RoleSelectProps) {
  const [showPopover, setShowPopover] = useState(false);

  return (
    <div className="flex flex-wrap items-center gap-1 max-h-20 max-w-64 overflow-y-scroll no-scrollbar">
      {rolePreferences.map((role) => (
        <div
          key={role}
          style={{
            backgroundColor: applicantRoleColor(role),
            color: applicantRoleDarkColor(role),
          }}
          className={`rounded-full h-7 px-2 py-1 bg-muted text-sm flex flex-row gap-1 items-center`}
        >
          <span className="text-sm">{displayApplicantRoleName(role)}</span>
          <Button
            disabled={disabled}
            variant="ghost"
            className="size-3"
            onClick={() => onDelete(role, reviewerId)}
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
          <RoleSearchPopover reviewerId={reviewerId} onSelect={onAdd} />
        </PopoverContent>
      </Popover>
    </div>
  );
}
