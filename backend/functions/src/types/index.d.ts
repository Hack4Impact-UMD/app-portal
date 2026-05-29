import type { DecodedIdToken } from "firebase-admin/auth";

export {};

declare global {
  namespace Express {
    export interface Request {
      token?: DecodedIdToken;
    }
  }
}
