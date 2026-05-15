import { ApplicationStatus } from "@/types/types";
import { getApplicationResponseAndSemester } from "./applicationResponseAndSemesterService";

/***
 * Determines how many applications a given user has previously applied for.
 */

export async function getPreviouslyAppliedCount(
  userId: string,
): Promise<number> {
  const responses = await getApplicationResponseAndSemester(userId);

  const inactiveFormIds = new Set<string>();

  for (const response of responses) {
    if (!response.active && response.status !== ApplicationStatus.InProgress) {
      inactiveFormIds.add(response.applicationFormId);
    }
  }

  return inactiveFormIds.size;
}
