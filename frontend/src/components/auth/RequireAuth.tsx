import type { PermissionRole } from "@app-portal/shared/constants";
import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";

import Loading from "@/components/Loading";
import { auth } from "@/config/firebase";
import { useAuth } from "@/hooks/useAuth";

interface RequireAuthProps {
  requireRoles?: PermissionRole[];
  children: ReactNode;
}

export default function RequireAuth({
  requireRoles,
  children,
}: RequireAuthProps) {
  const { isLoading, isAuthed, user } = useAuth();
  const location = useLocation();

  // check if auth state has been loaded
  if (isLoading) return <Loading />;

  if (isAuthed) {
    // email not verified yet, take them to the verify page.
    if (!auth.currentUser?.emailVerified) {
      console.log("User email not verified, redirecting...");
      return <Navigate to="/verify" />;
    }

    // user is logged in, check if there are role restrictions
    if (requireRoles) {
      // enforce role restrictions
      if (requireRoles.includes(user!.role)) {
        return children;
      } else {
        return (
          <Navigate to={"/login"} replace state={{ path: location.pathname }} />
        );
      }
    } else {
      // no role restrictions, show children
      return children;
    }
  } else {
    // not logged in, redirect to login page
    return (
      <Navigate to={"/login"} replace state={{ path: location.pathname }} />
    );
  }
}
