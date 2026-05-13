import {
  ApplicantUserProfile,
  PermissionRole,
  UserProfile,
} from "@/types/types";
import {
  ColumnDef,
  createColumnHelper,
  RowSelectionState,
} from "@tanstack/react-table";
import { DataTable } from "../DataTable";
import { Checkbox } from "../ui/checkbox";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import { displayUserRoleName } from "@/utils/display";
import { throwErrorToast } from "../toasts/ErrorToast";
import { Timestamp } from "firebase/firestore";
import { ArrowDown, ArrowUp, ArrowUpDown, TrashIcon } from "lucide-react";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";

type UserTableProps = {
  users: UserProfile[];
  setUserRoles: (users: UserProfile[], role: PermissionRole) => void;
  deleteUsers: (users: UserProfile[]) => void;
  setActiveStatus: (user: UserProfile, inactive: boolean) => void;
};

export default function UserTable({
  users,
  setUserRoles,
  deleteUsers,
  setActiveStatus,
}: UserTableProps) {
  const [searchFilter, setSearchFilter] = useState("");
  const [toUpdate, setToUpdate] = useState<UserProfile[]>([]);
  const [selectedRows, setSelectedRows] = useState<RowSelectionState>({});
  const [action, setAction] = useState<"delete" | "role">();

  function DeleteDialog() {
    return (
      <>
        <DialogHeader>
          <DialogTitle>Confirm User Deletion</DialogTitle>
          <DialogDescription>
            <span className="text-destructive font-bold">
              This action cannot be undone! Deleting users may cause unforeseen
              issues with other data types. Are you ABSOLUTELY sure you know
              what you're doing?
            </span>{" "}
            The following users will be permanently deleted:
          </DialogDescription>
        </DialogHeader>
        <div className="flex items-center space-x-2 max-h-32 overflow-y-scroll">
          <ul className="list-disc list-inside">
            {toUpdate.map((u) => (
              <li key={u.id}>
                {u.firstName} {u.lastName} ({u.email})
              </li>
            ))}
          </ul>
        </div>
        <DialogFooter className="sm:justify-start flex">
          <DialogClose asChild className="grow">
            <Button type="button" variant="secondary">
              Cancel
            </Button>
          </DialogClose>
          <DialogClose asChild>
            <Button
              type="button"
              variant="destructive"
              onClick={() => deleteUsers(toUpdate)}
            >
              Delete
            </Button>
          </DialogClose>
        </DialogFooter>
      </>
    );
  }

  function RoleDialog() {
    const [role, setRole] = useState<PermissionRole>(PermissionRole.Applicant);

    return (
      <>
        <DialogHeader>
          <DialogTitle>Update Roles</DialogTitle>
          <DialogDescription>
            Select the role to assign the following users:
          </DialogDescription>
        </DialogHeader>
        <div className="flex items-center space-x-2 max-h-32 overflow-y-scroll">
          <ul className="list-disc list-inside">
            {toUpdate.map((u) => (
              <li key={u.id}>
                {u.firstName} {u.lastName} ({u.email})
              </li>
            ))}
          </ul>
        </div>
        <select
          value={role}
          className="bg-lightgray p-2 rounded-sm"
          onChange={(e) => setRole(e.target.value as PermissionRole)}
        >
          {Object.entries(PermissionRole).map((e) => (
            <option key={e[1]} value={e[1]}>
              {displayUserRoleName(e[1])}
            </option>
          ))}
        </select>
        <DialogFooter className="sm:justify-start flex">
          <DialogClose asChild className="grow">
            <Button
              type="button"
              variant="default"
              onClick={() => setUserRoles(toUpdate, role)}
            >
              Update
            </Button>
          </DialogClose>
          <DialogClose asChild>
            <Button type="button" variant="secondary">
              Cancel
            </Button>
          </DialogClose>
        </DialogFooter>
      </>
    );
  }

  function WhitelistDialog() {
    const [input, setInput] = useState("");

    function handleUpdate() {
      const emails = input
        .split("\n")
        .map((e) => e.trim())
        .filter((e) => e.length !== 0);
      const usersToUpdate = emails
        .map((email) => users.find((u) => u.email === email))
        .filter((u) => u !== undefined);

      console.log("Setting the following users to REVIEWER: ", usersToUpdate);

      if (usersToUpdate.length === 0) {
        throwErrorToast("The emails you entered don't match any users");
      } else if (usersToUpdate.length !== emails.length) {
        throwErrorToast(
          `Some emails did not match existing users. Inputted ${emails.length} emails, but found ${usersToUpdate.length} corresponding users!`,
        );
        setUserRoles(usersToUpdate, PermissionRole.Reviewer);
      } else {
        setUserRoles(usersToUpdate, PermissionRole.Reviewer);
      }
    }

    return (
      <>
        <DialogHeader>
          <DialogTitle>Whitelist Reviewers</DialogTitle>
          <DialogDescription>
            Paste a list of emails to assign the reviewer role to the
            corresponding users. Emails should be separated by a new line. The
            whitelist will only apply to currently registered users.{" "}
            <span className="font-bold">
              Users that register after the whitelist is applied will need to be
              whitelisted again or manually assigned the reviewer role.
            </span>
          </DialogDescription>
        </DialogHeader>
        <div className="flex items-center space-x-2 max-h-32 overflow-y-scroll">
          <Textarea
            className="w-full min-h-32 border rounded-sm p-1 text-sm bg-lightgray"
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
        </div>
        <DialogFooter className="sm:justify-start flex">
          <DialogClose asChild className="grow">
            <Button type="button" variant="default" onClick={handleUpdate}>
              Update
            </Button>
          </DialogClose>
          <DialogClose asChild>
            <Button type="button" variant="secondary">
              Cancel
            </Button>
          </DialogClose>
        </DialogFooter>
      </>
    );
  }

  const columnHelper = createColumnHelper<UserProfile>();
  const columns = useMemo(
    () =>
      [
        columnHelper.display({
          id: "select",
          cell: ({ row }) => {
            return (
              <div>
                <Checkbox
                  className="size-5"
                  checked={row.getIsSelected()}
                  onClick={() => row.toggleSelected()}
                />
              </div>
            );
          },
          header: ({ table }) => {
            return (
              <div>
                <Checkbox
                  className="size-5"
                  checked={table.getIsAllRowsSelected()}
                  onClick={() => table.toggleAllRowsSelected()}
                />
              </div>
            );
          },
        }),
        columnHelper.accessor(
          (profile) => `${profile.firstName} ${profile.lastName}`,
          {
            id: "name",
            header: ({ column }) => {
              return (
                <Button
                  variant="ghost"
                  className="p-0"
                  onClick={() =>
                    column.toggleSorting(column.getIsSorted() === "asc")
                  }
                >
                  <span className="items-center flex flex-row gap-1">
                    NAME
                    {column.getIsSorted() === false ? (
                      <ArrowUpDown />
                    ) : column.getIsSorted() === "desc" ? (
                      <ArrowUp />
                    ) : (
                      <ArrowDown />
                    )}
                  </span>
                </Button>
              );
            },
            cell: ({ getValue, row }) => {
              return (
                <span className="flex items-center gap-2">
                  <span>{getValue()}</span>
                  {(row.original as ApplicantUserProfile)?.isInternal && (
                    <span className="bg-purple-100 text-purple-800 text-xs px-2 py-0.5 rounded-full">
                      Internal
                    </span>
                  )}
                </span>
              );
            },
          },
        ),
        columnHelper.accessor("id", {
          header: ({ column }) => {
            return (
              <Button
                variant="ghost"
                className="p-0"
                onClick={() =>
                  column.toggleSorting(column.getIsSorted() === "asc")
                }
              >
                <span className="items-center flex flex-row gap-1">
                  USER ID
                  {column.getIsSorted() === false ? (
                    <ArrowUpDown />
                  ) : column.getIsSorted() === "desc" ? (
                    <ArrowUp />
                  ) : (
                    <ArrowDown />
                  )}
                </span>
              </Button>
            );
          },
        }),
        columnHelper.accessor("email", {
          header: ({ column }) => {
            return (
              <Button
                variant="ghost"
                className="p-0"
                onClick={() =>
                  column.toggleSorting(column.getIsSorted() === "asc")
                }
              >
                <span className="items-center flex flex-row gap-1">
                  EMAIL
                  {column.getIsSorted() === false ? (
                    <ArrowUpDown />
                  ) : column.getIsSorted() === "desc" ? (
                    <ArrowUp />
                  ) : (
                    <ArrowDown />
                  )}
                </span>
              </Button>
            );
          },
        }),
        columnHelper.accessor("dateCreated", {
          header: ({ column }) => {
            return (
              <Button
                variant="ghost"
                className="p-0"
                onClick={() =>
                  column.toggleSorting(column.getIsSorted() === "asc")
                }
              >
                <span className="items-center flex flex-row gap-1">
                  DATE CREATED
                  {column.getIsSorted() === false ? (
                    <ArrowUpDown />
                  ) : column.getIsSorted() === "desc" ? (
                    <ArrowUp />
                  ) : (
                    <ArrowDown />
                  )}
                </span>
              </Button>
            );
          },
          cell: ({ row }) => {
            const ts = row.getValue("dateCreated") as Timestamp;
            return (
              <span>
                {ts.toDate().toLocaleDateString() +
                  " " +
                  ts.toDate().toLocaleTimeString()}
              </span>
            );
          },
        }),
        columnHelper.accessor((user) => user.inactive ?? false, {
          id: "inactive",
          header: ({ column }) => {
            return (
              <Button
                variant="ghost"
                className="p-0"
                onClick={() =>
                  column.toggleSorting(column.getIsSorted() === "asc")
                }
              >
                <span className="items-center flex flex-row gap-1">
                  DEPRECATED
                  {column.getIsSorted() === false ? (
                    <ArrowUpDown />
                  ) : column.getIsSorted() === "desc" ? (
                    <ArrowUp />
                  ) : (
                    <ArrowDown />
                  )}
                </span>
              </Button>
            );
          },
          cell: ({ getValue, row }) => {
            const user = row.original;
            return (
              <div className="w-full flex items-center justify-center">
                <Checkbox
                  className="size-5"
                  checked={getValue() ?? false}
                  onCheckedChange={(inactive) =>
                    setActiveStatus(user, inactive as boolean)
                  }
                />
              </div>
            );
          },
        }),
        columnHelper.accessor("role", {
          header: ({ column }) => {
            return (
              <Button
                variant="ghost"
                className="p-0"
                onClick={() =>
                  column.toggleSorting(column.getIsSorted() === "asc")
                }
              >
                <span className="items-center flex flex-row gap-1">
                  ROLE
                  {column.getIsSorted() === false ? (
                    <ArrowUpDown />
                  ) : column.getIsSorted() === "desc" ? (
                    <ArrowUp />
                  ) : (
                    <ArrowDown />
                  )}
                </span>
              </Button>
            );
          },
          cell: ({ getValue, row }) => {
            const role = getValue();
            const isInternal = (row.original as ApplicantUserProfile)
              ?.isInternal;
            return (
              <Select
                value={role}
                onValueChange={(e) =>
                  setUserRoles([row.original], e as PermissionRole)
                }
                disabled={isInternal}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {Object.entries(PermissionRole).map((e) => (
                      <SelectItem value={e[1]} key={e[1]}>
                        {displayUserRoleName(e[1] as PermissionRole)}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            );
          },
        }),
        columnHelper.display({
          id: "delete",
          cell: ({ row }) => {
            return (
              <DialogTrigger
                className="cursor-pointer border rounded-sm p-2"
                onClick={() => setToUpdate([row.original])}
              >
                <TrashIcon className="size-4 text-red-600" />
              </DialogTrigger>
            );
          },
        }),
      ] as ColumnDef<UserProfile>[],
    [columnHelper, setActiveStatus, setUserRoles],
  );

  const selectedUsers = useMemo(
    () =>
      Object.keys(selectedRows)
        .filter((k) => selectedRows[k])
        .map((i) => users[parseInt(i)]),
    [selectedRows, users],
  );

  return (
    <div>
      <div className="flex flex-row gap-2 mb-2">
        <div className="grow">
          <Input
            type="text"
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            className="min-h-5 max-w-sm px-2 py-1 border-gray-400 border rounded-sm"
            placeholder="Search"
          />
        </div>

        <Dialog>
          <DialogTrigger asChild>
            <Button variant="secondary">Whitelist Reviewers</Button>
          </DialogTrigger>
          <DialogContent>
            <WhitelistDialog />
          </DialogContent>
        </Dialog>

        <Dialog>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button>Bulk Actions</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuLabel>Apply to selected users</DropdownMenuLabel>
              <DropdownMenuSeparator></DropdownMenuSeparator>
              <DialogTrigger
                className="cursor-pointer"
                disabled={selectedUsers.length === 0}
                asChild
                onClick={() => {
                  setToUpdate(selectedUsers);
                  setAction("role");
                }}
              >
                <DropdownMenuItem>
                  <span>Change roles...</span>
                </DropdownMenuItem>
              </DialogTrigger>
              <DialogTrigger
                className="cursor-pointer text-destructive"
                disabled={selectedUsers.length === 0}
                asChild
                onClick={() => {
                  setToUpdate(selectedUsers);
                  setAction("delete");
                }}
              >
                <DropdownMenuItem>
                  <span>Delete selected</span>
                </DropdownMenuItem>
              </DialogTrigger>
            </DropdownMenuContent>
          </DropdownMenu>

          <DialogContent className="sm:max-w-md">
            {action === "delete" ? <DeleteDialog /> : <RoleDialog />}
          </DialogContent>
        </Dialog>
      </div>

      <Dialog>
        <DataTable
          options={{
            onRowSelectionChange: setSelectedRows,
            state: {
              globalFilter: searchFilter,
              rowSelection: selectedRows,
            },
          }}
          data={users}
          columns={columns}
        ></DataTable>

        <DialogContent className="sm:max-w-md">
          <DeleteDialog />
        </DialogContent>
      </Dialog>
    </div>
  );
}
