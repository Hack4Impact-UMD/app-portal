import type { ApplicantUserProfile } from "@/types/types";

import { getUserById } from "./userService";

export async function getApplicantById(
  id: string,
): Promise<ApplicantUserProfile> {
  const user = await getUserById(id);
  return user as ApplicantUserProfile;
}
