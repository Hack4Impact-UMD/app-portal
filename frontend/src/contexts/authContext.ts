import { createContext } from "react";

import { loginUser, logoutUser } from "@/services/userService";
import type { UserProfile } from "@/types/types";

export type AuthProviderContext = {
  user?: UserProfile;
  token: () => Promise<string | undefined>;
  isAuthed: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<UserProfile>;
  logout: () => Promise<void>;
  setUser: (newUserData: UserProfile) => void;
};

export const AuthContext = createContext<AuthProviderContext>({
  isAuthed: false,
  isLoading: true,
  token: () => Promise.resolve(undefined),
  login: loginUser,
  logout: logoutUser,
  setUser: () => {},
});
