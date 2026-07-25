import type { ApplicationForm } from "@/types/types";

/**
 * A "private form" is a form that is not surfaced to the general applicant
 * pool via `getActiveForm()`, and is instead only visible to the user IDs
 * listed in `invitedUsers`. A form counts as private if it is explicitly
 * flagged as such, or if it's inactive with at least one invited user.
 */
export function isPrivateForm(form: ApplicationForm): boolean {
  return (
    form.isPrivate === true ||
    (!form.isActive && (form.invitedUsers?.length ?? 0) > 0)
  );
}
