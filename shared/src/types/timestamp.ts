export interface TimestampLike {
  readonly seconds: number;
  readonly nanoseconds: number;
  toDate(): Date;
  toMillis(): number;
}

// API outputs are typed with TimestampLike since the client and admin SDKs
// have distinct Timestamp classes.
export type WithTimestamps<T, K extends string> = T extends unknown
  ? Omit<T, K> & { [P in K]: TimestampLike }
  : never;
