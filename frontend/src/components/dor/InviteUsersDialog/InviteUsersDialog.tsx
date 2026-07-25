import { XIcon } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { throwErrorToast } from "@/components/toasts/ErrorToast";
import { throwSuccessToast } from "@/components/toasts/SuccessToast";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Command,
  CommandEmpty,
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
import { useUpdateFormInvitedUsers } from "@/hooks/useApplicationForm";
import { useUsers } from "@/hooks/useUsers";
import type { ApplicationForm } from "@/types/types";

export default function InviteUsersDialog({
  open,
  onOpenChange,
  form,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  form: ApplicationForm;
}) {
  const { data: users = [], isPending } = useUsers();
  const { mutate: updateInvitedUsers, isPending: isSaving } =
    useUpdateFormInvitedUsers();

  const [selected, setSelected] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (open) {
      setSelected(new Set(form.invitedUsers ?? []));
    }
  }, [open, form.invitedUsers]);

  const usersById = useMemo(() => {
    const map = new Map<string, (typeof users)[number]>();
    users.forEach((u) => map.set(u.id, u));
    return map;
  }, [users]);

  const sortedUsers = useMemo(
    () =>
      [...users].sort((a, b) =>
        `${a.firstName} ${a.lastName}`.localeCompare(
          `${b.firstName} ${b.lastName}`,
        ),
      ),
    [users],
  );

  const selectedUsers = useMemo(
    () =>
      Array.from(selected)
        .map((id) => usersById.get(id))
        .filter((u) => u !== undefined)
        .sort((a, b) =>
          `${a.firstName} ${a.lastName}`.localeCompare(
            `${b.firstName} ${b.lastName}`,
          ),
        ),
    [selected, usersById],
  );

  function toggleUser(userId: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) next.delete(userId);
      else next.add(userId);
      return next;
    });
  }

  function handleSave() {
    updateInvitedUsers(
      { formId: form.id, invitedUsers: Array.from(selected) },
      {
        onSuccess: () => {
          throwSuccessToast("Invited users updated successfully!");
          onOpenChange(false);
        },
        onError: (error) => {
          throwErrorToast("Failed to update invited users.");
          console.error(error);
        },
      },
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        onCloseAutoFocus={(event) => {
          event.preventDefault();
          document.body.style.pointerEvents = "";
        }}
      >
        <DialogHeader>
          <DialogTitle>Invite Users to {form.id}</DialogTitle>
          <DialogDescription>
            Search for users and select who can access this private form. Only
            selected users will see it on their apply page.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-2">
          <p className="text-sm font-medium">
            Invited users ({selectedUsers.length})
          </p>
          <div className="flex flex-wrap gap-2 min-h-9 rounded-md border border-dashed border-gray-300 p-2">
            {selectedUsers.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No users invited yet. Search below to add some.
              </p>
            ) : (
              selectedUsers.map((invitedUser) => (
                <span
                  key={invitedUser.id}
                  className="flex items-center gap-1 bg-lightblue text-blue text-sm rounded-full pl-3 pr-1 py-1"
                >
                  {invitedUser.firstName} {invitedUser.lastName}
                  <button
                    type="button"
                    aria-label={`Remove ${invitedUser.firstName} ${invitedUser.lastName}`}
                    onClick={() => toggleUser(invitedUser.id)}
                    className="rounded-full p-0.5 hover:bg-blue/20 cursor-pointer"
                  >
                    <XIcon className="size-3" />
                  </button>
                </span>
              ))
            )}
          </div>
        </div>

        <Command className="rounded-md border" shouldFilter={true}>
          <CommandInput placeholder="Search by name or email..." />
          <CommandList>
            <CommandEmpty>
              {isPending ? "Loading users..." : "No users found."}
            </CommandEmpty>
            {sortedUsers.map((user) => {
              const isSelected = selected.has(user.id);
              return (
                <CommandItem
                  key={user.id}
                  value={`${user.firstName} ${user.lastName} ${user.email}`}
                  onSelect={() => toggleUser(user.id)}
                  className="cursor-pointer"
                >
                  <Checkbox
                    checked={isSelected}
                    className="pointer-events-none"
                    tabIndex={-1}
                  />
                  <span className="flex-1">
                    {user.firstName} {user.lastName}
                  </span>
                  <span className="text-muted-foreground text-xs">
                    {user.email}
                  </span>
                </CommandItem>
              );
            })}
          </CommandList>
        </Command>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? "Saving..." : "Save Invitees"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
