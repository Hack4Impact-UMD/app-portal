import type { PermissionRole } from "@app-portal/shared/constants";
import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";

import Loading from "@/components/Loading";
import { useAuth } from "@/hooks/useAuth";

interface RequireNoAuthProps {
  children: ReactNode;
  redirect:
    | {
        [key in PermissionRole]: string;
      }
    | string;
}

export default function RequireNoAuth({
  children,
  redirect,
}: RequireNoAuthProps) {
  const { isLoading, isAuthed, user } = useAuth();

  if (isLoading) return <Loading />;

  console.log("role: " + user?.role);

  return !isAuthed ? (
    children
  ) : (
    <Navigate
      to={typeof redirect === "string" ? redirect : redirect[user!.role]}
      replace
    />
  );
}
