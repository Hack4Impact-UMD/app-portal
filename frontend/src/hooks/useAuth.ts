import { useContext } from "react";

import type { AuthProviderContext } from "@/contexts/authContext";
import { AuthContext } from "@/contexts/authContext";

export function useAuth(): AuthProviderContext {
  return useContext(AuthContext);
}
