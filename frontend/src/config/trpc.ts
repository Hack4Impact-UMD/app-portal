import { createTRPCClient, httpBatchLink, TRPCClientError } from "@trpc/client";
import { createTRPCOptionsProxy } from "@trpc/tanstack-react-query";
import type { AppRouter } from "functions/trpc";

import { API_URL, auth } from "@/config/firebase";
import { queryClient } from "@/config/query";
import { transformer } from "@/config/transformer";
import { getAppCheckToken } from "@/services/appCheckService";

export const trpcClient = createTRPCClient<AppRouter>({
  links: [
    httpBatchLink({
      url: `${API_URL}/trpc`,
      transformer,
      async headers() {
        const [idToken, appCheckToken] = await Promise.all([
          auth.currentUser?.getIdToken(),
          getAppCheckToken(),
        ]);
        return {
          "X-APPCHECK": appCheckToken,
          ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}),
        };
      },
    }),
  ],
});

export const trpc = createTRPCOptionsProxy<AppRouter>({
  client: trpcClient,
  queryClient,
});

export function isTRPCClientError(
  error: unknown,
): error is TRPCClientError<AppRouter> {
  return error instanceof TRPCClientError;
}
