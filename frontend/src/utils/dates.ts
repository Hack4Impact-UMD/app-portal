import { format } from "date-fns";
import type { Timestamp } from "firebase/firestore";

export function displayTimestamp(timestamp?: Timestamp) {
  if (!timestamp) return "N/A";
  return format(timestamp.toDate(), "M/d h:mm:ssaaa");
}
