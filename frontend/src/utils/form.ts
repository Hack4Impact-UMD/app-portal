import type { ApplicationForm } from "@/types/types";

/**
 * A "private form" is a form that is not surfaced to the general applicant
 * pool via `getActiveForm()`, and is instead only visible to the user IDs
 * listed in `invitedUsers`.
 *
 * This must stay in lockstep with the `isPrivate` checks in the Firestore
 * rules (`canRespondToFormData`) and in the backend's `canRespondToForm`
 * middleware — those are what actually enforce access, and a looser
 * definition here would badge a form as private in the UI while every
 * applicant could still read it and respond to it. Notably, an inactive form
 * with invitees is *not* private for that reason.
 */
export function isPrivateForm(form: ApplicationForm): boolean {
  return form.isPrivate === true;
}
