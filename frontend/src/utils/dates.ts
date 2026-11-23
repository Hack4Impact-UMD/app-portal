import type { TimestampLike } from "@app-portal/shared/types";
import { format } from "date-fns";

export function displayTimestamp(timestamp?: TimestampLike) {
  if (!timestamp) return "N/A";
  return format(timestamp.toDate(), "M/d h:mm:ssaaa");
}
