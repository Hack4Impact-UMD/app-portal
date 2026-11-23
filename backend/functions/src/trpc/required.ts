import type { ApplicationResponse } from "../models/appResponse";
import type { UserProfile } from "../models/user";
import { isReviewCapable } from "../models/user";
import { getForm } from "../services/forms";
import { isAssignedInterviewer } from "../services/interviewAssignments";
import { getResponse } from "../services/responses";
import { isAssignedReviewer } from "../services/reviewAssignments";
import { canReadResponse, isBoardOrAbove } from "./access";
import { forbidden, orNotFound } from "./errors";

export async function requireForm(id: string) {
  return orNotFound(await getForm(id), "Form not found");
}

export async function requireResponse(id: string) {
  return orNotFound(await getResponse(id), "Response not found");
}

async function isAssignedToResponse(user: UserProfile, responseId: string) {
  // Only plain reviewers' access depends on assignments.
  if (!isReviewCapable(user) || isBoardOrAbove(user)) return false;
  const [review, interview] = await Promise.all([
    isAssignedReviewer(user.id, responseId),
    isAssignedInterviewer(user.id, responseId),
  ]);
  return review || interview;
}

export async function ensureCanReadResponse(
  user: UserProfile,
  response: ApplicationResponse,
) {
  const assigned = await isAssignedToResponse(user, response.id);
  if (!canReadResponse(user, response, assigned)) {
    throw forbidden(`User ${user.id} may not read response ${response.id}`);
  }
}

export async function requireReadableResponse(user: UserProfile, id: string) {
  const response = await requireResponse(id);
  await ensureCanReadResponse(user, response);
  return response;
}
