import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";

export function createContext({ req, res }: CreateExpressContextOptions) {
  const authorization = req.headers.authorization;
  const idToken = authorization?.startsWith("Bearer ")
    ? authorization.slice("Bearer ".length)
    : undefined;

  return {
    req,
    res,
    idToken,
    appCheckToken: req.header("X-APPCHECK"),
  };
}

export type Context = ReturnType<typeof createContext>;
