import { getToken } from "firebase/app-check";

import { appCheck } from "@/config/firebase";

export async function getAppCheckToken() {
  if (!appCheck) return "app-check-disabled";
  return (await getToken(appCheck)).token;
}
