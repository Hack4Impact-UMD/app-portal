import { PermissionRole } from "@app-portal/shared/constants";
import type { ApplicantRole } from "@app-portal/shared/constants";
import { useMutation } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";

import ReviewerRoleSelectDialog from "@/components/reviewer/ReviewerRoleSelectDialog";
import { throwErrorToast } from "@/components/toasts/ErrorToast";
import { throwSuccessToast } from "@/components/toasts/SuccessToast";
import { auth } from "@/config/firebase";
import { AuthContext } from "@/contexts/authContext";
import {
  getUserById,
  loginUser,
  logoutUser,
  onAuthStateChange,
  setReviewCapableUserRolePreferences,
} from "@/services/userService";
import type { UserProfile } from "@/types/types";

interface AuthProviderProps {
  children?: ReactNode;
}

interface AuthState {
  user?: UserProfile;
  token: () => Promise<string | undefined>;
  isAuthed: boolean;
  isLoading: boolean;
}

export default function AuthProvider(props: AuthProviderProps) {
  const MIN_REVIEWER_ROLE_PREFS = 3;

  const [authState, setAuthState] = useState<AuthState>({
    user: undefined,
    token: () => Promise.resolve(undefined),
    isAuthed: false,
    isLoading: true,
  });

  const submitMutation = useMutation({
    mutationFn: (roles: ApplicantRole[]) =>
      setReviewCapableUserRolePreferences(authState.user?.id ?? "", roles),
    onSuccess: (_data, vars) => {
      if (authState.user?.role === PermissionRole.Reviewer) {
        setAuthState({
          ...authState,
          user: {
            ...authState.user!,
            applicantRolePreferences: vars,
          },
        });
        throwSuccessToast("Successfully updated role preferences!");
      }
    },
    onError: () => {
      throwErrorToast("Failed to set review preferences!");
    },
  });

  useEffect(() => {
    return onAuthStateChange(async (userInfo) => {
      console.log(`Auth state changed: ${userInfo?.email}`);
      if (userInfo != null) {
        const user = await getUserById(userInfo.uid);

        setAuthState({
          isAuthed: true,
          token: async () => await auth.currentUser?.getIdToken(),
          user: user,
          isLoading: false,
        });
      } else {
        setAuthState({
          isAuthed: false,
          token: () => Promise.resolve(undefined),
          user: undefined,
          isLoading: false,
        });
      }
    });
  }, []);

  return (
    <AuthContext.Provider
      value={{
        isLoading: authState.isLoading,
        isAuthed: authState.isAuthed,
        user: authState.user,
        token: authState.token,
        login: loginUser,
        logout: logoutUser,
        setUser: (newUser) => {
          setAuthState({
            ...authState,
            user: newUser,
          });
        },
      }}
    >
      {authState.user?.role === PermissionRole.Reviewer && (
        <ReviewerRoleSelectDialog
          open={
            !authState.user.applicantRolePreferences ||
            authState.user.applicantRolePreferences.length <
              MIN_REVIEWER_ROLE_PREFS
          }
          minRoles={MIN_REVIEWER_ROLE_PREFS}
          onSubmit={(roles) => submitMutation.mutate(roles)}
        />
      )}
      {props.children}
    </AuthContext.Provider>
  );
}
