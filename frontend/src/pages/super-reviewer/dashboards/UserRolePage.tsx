import type { PermissionRole } from "@app-portal/shared/constants";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import UserTable from "@/components/admin/UserTable";
import Loading from "@/components/Loading";
import { throwErrorToast } from "@/components/toasts/ErrorToast";
import { useUsers } from "@/hooks/useUsers";
import {
  deleteUsers,
  updateUserActiveStatus,
  updateUserRoles,
} from "@/services/userService";
import type { UserProfile } from "@/types/types";

export default function UserRolePage() {
  const { data: users, isPending, error } = useUsers();
  const queryClient = useQueryClient();

  const { mutate: setUserActiveStatus } = useMutation({
    mutationFn: ({
      user,
      inactive,
    }: {
      user: UserProfile;
      inactive: boolean;
    }) => updateUserActiveStatus(user.id, inactive),
    onMutate: async ({ user, inactive }) => {
      await queryClient.cancelQueries({ queryKey: ["users", "all"] });
      const prevUsers = queryClient.getQueryData<UserProfile[]>([
        "users",
        "all",
      ]);

      queryClient.setQueryData<UserProfile[]>(["users", "all"], (old) =>
        old?.map((prevUser) => {
          if (prevUser.id === user.id) {
            return {
              ...prevUser,
              inactive: inactive ?? false,
            };
          } else {
            return prevUser;
          }
        }),
      );

      return { prevUsers };
    },
    onError: (err, update, ctx) => {
      throwErrorToast("Failed to update user active status!");
      console.error("Active status update failed");
      console.error(err);
      console.error("Update:", update);
      queryClient.setQueryData(["users", "all"], ctx?.prevUsers);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["users", "all"] });
      queryClient.invalidateQueries({ queryKey: ["reviewers"] });
    },
  });

  const { mutate: setUsersRoles } = useMutation({
    mutationFn: ({
      users,
      role,
    }: {
      users: UserProfile[];
      role: PermissionRole;
    }) => {
      return updateUserRoles(users, role);
    },
    onMutate: async ({ users, role }) => {
      await queryClient.cancelQueries({ queryKey: ["users"] });
      const prevUsers = queryClient.getQueryData(["users", "all"]);
      const uids = new Set(users.map((u) => u.id));

      queryClient.setQueryData(["users", "all"], (old: UserProfile[]) =>
        old.map((user) => {
          if (uids.has(user.id)) {
            return {
              ...user,
              role: role,
            };
          } else {
            return user;
          }
        }),
      );

      return { prevUsers };
    },
    onError: (err, update, ctx) => {
      throwErrorToast("Failed to update user roles!");
      console.error("Role update failed");
      console.error(err);
      console.error("Update:", update);
      queryClient.setQueryData(["users", "all"], ctx?.prevUsers);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });

  const { mutate: bulkDeleteUsers } = useMutation({
    mutationFn: (users: UserProfile[]) => {
      return deleteUsers(users.map((u) => u.id));
    },
    onMutate: async (users) => {
      await queryClient.cancelQueries({ queryKey: ["users"] });
      const prevUsers = queryClient.getQueryData(["users", "all"]);
      const uids = users.map((u) => u.id);

      queryClient.setQueryData(["users", "all"], (old: UserProfile[]) =>
        old.filter((user) => {
          if (uids.includes(user.id)) {
            return false;
          } else {
            return true;
          }
        }),
      );

      return { prevUsers };
    },
    onError: (err, update, ctx) => {
      throwErrorToast("Failed to delete users!");
      console.error("Delete failed");
      console.error(err);
      console.error("Update:", update);
      queryClient.setQueryData(["users", "all"], ctx?.prevUsers);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });

  if (isPending) return <Loading />;

  return (
    <div className="p-4 w-full flex flex-col items-center bg-lightgray">
      <div className="w-full max-w-5xl bg-white p-4 rounded">
        <h1 className="font-bold text-xl mb-5 pt-5">Manage Users</h1>
        {error ? (
          <p>An error occurred while loading user data: {error.message}</p>
        ) : (
          <UserTable
            users={users ?? []}
            setUserRoles={(users, role) => setUsersRoles({ users, role })}
            deleteUsers={(users) => bulkDeleteUsers(users)}
            setActiveStatus={(user, inactive) =>
              setUserActiveStatus({ user, inactive })
            }
          />
        )}
      </div>
    </div>
  );
}
