import type { inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "functions/trpc";

export type RouterOutputs = inferRouterOutputs<AppRouter>;
