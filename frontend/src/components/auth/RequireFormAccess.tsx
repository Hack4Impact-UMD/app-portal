import { PermissionRole } from "@app-portal/shared/constants";
import type { ReactNode } from "react";
import { Navigate, useLocation, useParams } from "react-router-dom";

import Loading from "@/components/Loading";
import { auth } from "@/config/firebase";
import { useApplicationForm } from "@/hooks/useApplicationForm";
import { useAuth } from "@/hooks/useAuth";

// Private forms can invite users of any role, so gating these routes to
// Applicant-only (as RequireAuth's requireRoles does) would lock out invited
// reviewers/board members. Instead, allow anyone the backend would also let
// respond to this form: applicants (on public forms) or anyone invited.
export default function RequireFormAccess({
  children,
}: {
  children: ReactNode;
}) {
  const { isLoading, isAuthed, user } = useAuth();
  const location = useLocation();
  const { formId } = useParams();
  const {
    data: form,
    isPending: formPending,
    isError: formError,
  } = useApplicationForm(formId);

  if (isLoading || (isAuthed && formPending && !formError)) return <Loading />;

  if (!isAuthed) {
    return (
      <Navigate to={"/login"} replace state={{ path: location.pathname }} />
    );
  }

  if (!auth.currentUser?.emailVerified) {
    return <Navigate to="/verify" />;
  }

  // The form must actually have loaded before it can be judged public: a
  // missing or unreadable form leaves `form` undefined, and `!form?.isPrivate`
  // would then read as "public" and admit anyone. That is exactly the case
  // this guard exists for — an uninvited applicant's fetch of a private form
  // fails with permission-denied.
  const isInvited = !!user && !!form?.invitedUsers?.includes(user.id);
  const isApplicantOnPublicForm =
    !!form && user?.role === PermissionRole.Applicant && !form.isPrivate;

  if (isApplicantOnPublicForm || isInvited) {
    return children;
  }

  return <Navigate to={"/login"} replace state={{ path: location.pathname }} />;
}
