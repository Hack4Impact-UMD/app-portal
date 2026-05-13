import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { PermissionRole } from "../../types/types";
import Loading from "../Loading";

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
