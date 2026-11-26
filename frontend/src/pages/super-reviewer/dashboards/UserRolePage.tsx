import { ApplicantRole, PermissionRole } from "@app-portal/shared/constants";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import UserTable from "@/components/admin/UserTable";
import Spinner from "@/components/Spinner";
import { throwErrorToast } from "@/components/toasts/ErrorToast";
import { trpc, trpcClient } from "@/config/trpc";
import { useUsers } from "@/hooks/useUsers";
import type { UserProfile } from "@/types/types";

function withRole(user: UserProfile, role: PermissionRole): UserProfile {
  switch (role) {
    case PermissionRole.Applicant:
    case PermissionRole.SuperReviewer:
      return { ...user, role };
    case PermissionRole.Reviewer:
      return {
        ...user,
        role,
        applicantRolePreferences:
          "applicantRolePreferences" in user
            ? user.applicantRolePreferences
            : Object.values(ApplicantRole),
      };
    case PermissionRole.Board:
      return {
        ...user,
        role,
        applicantRoles: "applicantRoles" in user ? user.applicantRoles : [],
      };
  }
}

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
    }) => trpcClient.users.setInactive.mutate({ id: user.id, inactive }),
    onMutate: async ({ user, inactive }) => {
      const usersKey = trpc.users.list.queryKey();
      await queryClient.cancelQueries({ queryKey: usersKey });
      const prevUsers = queryClient.getQueryData<UserProfile[]>(usersKey);

      queryClient.setQueryData<UserProfile[]>(usersKey, (old) =>
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
      queryClient.setQueryData(trpc.users.list.queryKey(), ctx?.prevUsers);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: trpc.users.pathKey() });
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
      return trpcClient.users.setRole.mutate({
        ids: users.map((u) => u.id),
        role,
      });
    },
    onMutate: async ({ users, role }) => {
      const usersKey = trpc.users.list.queryKey();
      await queryClient.cancelQueries({ queryKey: trpc.users.pathKey() });
      const prevUsers = queryClient.getQueryData<UserProfile[]>(usersKey);
      const uids = new Set(users.map((u) => u.id));

      queryClient.setQueryData<UserProfile[]>(usersKey, (old) =>
        old?.map((user) => {
          if (uids.has(user.id)) {
            return withRole(user, role);
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
      queryClient.setQueryData(trpc.users.list.queryKey(), ctx?.prevUsers);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: trpc.users.pathKey() });
    },
  });

  const { mutate: bulkDeleteUsers } = useMutation({
    mutationFn: (users: UserProfile[]) => {
      return trpcClient.users.delete.mutate({ ids: users.map((u) => u.id) });
    },
    onMutate: async (users) => {
      const usersKey = trpc.users.list.queryKey();
      await queryClient.cancelQueries({ queryKey: trpc.users.pathKey() });
      const prevUsers = queryClient.getQueryData<UserProfile[]>(usersKey);
      const uids = users.map((u) => u.id);

      queryClient.setQueryData<UserProfile[]>(usersKey, (old) =>
        old?.filter((user) => {
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
      queryClient.setQueryData(trpc.users.list.queryKey(), ctx?.prevUsers);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: trpc.users.pathKey() });
    },
  });

  if (isPending)
    return (
      <div className="flex items-center justify-center p-4 w-full h-full">
        <Spinner />
      </div>
    );

  return (
    <div className="p-4 w-full flex flex-col items-center bg-lightgray">
      <div className="w-full max-w-7xl bg-white p-4 rounded">
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
