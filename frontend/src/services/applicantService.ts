import type { ApplicantUserProfile } from "@/types/types";

import { getApplicationResponseById } from "./applicationResponsesService";
import { getUserById } from "./userService";

export async function getApplicantById(
  id: string,
): Promise<ApplicantUserProfile> {
  const user = await getUserById(id);
  return user as ApplicantUserProfile;
}

export async function getApplicantForResponse(responseId: string) {
  const response = await getApplicationResponseById(responseId);
  if (!response) throw new Error("Response not found!");

  const user = await getApplicantById(response.userId);
  return user;
}
