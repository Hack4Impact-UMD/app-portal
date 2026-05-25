import { PermissionRole } from "@app-portal/shared/constants";
import { XIcon } from "lucide-react";
import { useCallback, useMemo, useState } from "react";

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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAllReviewers } from "@/hooks/useReviewers";
import { reviewingFor } from "@/services/reviewersService";
import type { ReviewCapableUser } from "@/types/types";

type ExemptReviewersDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (exemptReviewers: ReviewCapableUser[]) => void;
  disabled?: boolean;
};

export default function ExemptReviewersDialog({
  open,
  onOpenChange,
  onSubmit,
  disabled = false,
}: ExemptReviewersDialogProps) {
  const { data: reviewers, isPending, error } = useAllReviewers();
  const [reviewerSearch, setReviewerSearch] = useState("");
  const [selectedExemptReviewers, setSelectedExemptReviewers] = useState<
    ReviewCapableUser[]
  >([]);

  const availableReviewers = useMemo(() => {
    return (
      reviewers?.filter(
        (r) => !selectedExemptReviewers.some((sr) => sr.id === r.id),
      ) || []
    );
  }, [reviewers, selectedExemptReviewers]);

  const filteredReviewers = useMemo(() => {
    return availableReviewers.filter((r) =>
      `${r.firstName} ${r.lastName} ${reviewingFor(r).join(" ")}`
        .toLowerCase()
        .includes(reviewerSearch.toLowerCase()),
    );
  }, [availableReviewers, reviewerSearch]);

  const addReviewer = useCallback((reviewer: ReviewCapableUser) => {
    setSelectedExemptReviewers((prev) => [...prev, reviewer]);
    setReviewerSearch("");
  }, []);

  const removeReviewer = useCallback((reviewerId: string) => {
    setSelectedExemptReviewers((prev) =>
      prev.filter((r) => r.id !== reviewerId),
    );
  }, []);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Select Exempt Reviewers</DialogTitle>
          <DialogDescription>
            Select reviewers to exempt from auto-assignment. Or, click skip to
            use all valid reviewers.
          </DialogDescription>
        </DialogHeader>

        {isPending ? (
          <Spinner />
        ) : error ? (
          <p>Failed to fetch reviewers: {error.message}</p>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Selected Exempt Reviewers
              </label>
              {selectedExemptReviewers.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No reviewers selected
                </p>
              ) : (
                <div className="flex flex-wrap gap-2 mt-1 max-h-32 overflow-y-auto">
                  {selectedExemptReviewers.map((reviewer) => (
                    <div
                      key={reviewer.id}
                      className="inline-flex items-center gap-1 rounded-full border bg-muted px-3 py-1 text-sm"
                    >
                      <span>
                        {reviewer.firstName} {reviewer.lastName}
                      </span>
                      <Button
                        variant="ghost"
                        className="h-4 w-4 p-0 hover:bg-transparent"
                        onClick={() => removeReviewer(reviewer.id)}
                      >
                        <XIcon className="size-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Search Reviewers</label>
              <Command className="rounded-lg border">
                <CommandInput
                  placeholder="Search by name or role..."
                  value={reviewerSearch}
                  onValueChange={setReviewerSearch}
                />
                <CommandList className="h-60 overflow-y-auto">
                  <CommandEmpty>No reviewers found.</CommandEmpty>
                  <CommandGroup>
                    {filteredReviewers.map((reviewer) => (
                      <CommandItem
                        key={reviewer.id}
                        value={`${reviewer.firstName} ${reviewer.lastName}`}
                        className="flex flex-col items-start gap-1 cursor-pointer"
                        onSelect={() => addReviewer(reviewer)}
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-base">
                            {reviewer.firstName} {reviewer.lastName}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {reviewer.role === PermissionRole.SuperReviewer ? (
                            <span className="text-xs bg-blue-100 text-blue-800 rounded-full px-2 py-1">
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
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button
            disabled={disabled}
            variant="secondary"
            onClick={() => onSubmit([])}
          >
            Skip
          </Button>
          <Button
            disabled={disabled}
            onClick={() => onSubmit(selectedExemptReviewers)}
          >
            Next
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
