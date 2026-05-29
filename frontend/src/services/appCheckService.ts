import { getToken } from "firebase/app-check";

import { appCheck } from "@/config/firebase";

export async function getAppCheckToken() {
  return (await getToken(appCheck)).token;
}
