import { Timestamp } from "firebase/firestore";
import { SuperJSON } from "superjson";

export const transformer = new SuperJSON();

transformer.registerCustom<Timestamp, { seconds: number; nanoseconds: number }>(
  {
    isApplicable: (v): v is Timestamp => v instanceof Timestamp,
    serialize: (v) => ({ seconds: v.seconds, nanoseconds: v.nanoseconds }),
    deserialize: (v) => new Timestamp(v.seconds, v.nanoseconds),
  },
  "Timestamp",
);
