import { Button } from "@/components/ui/button";
import { useWizardStep } from "@/components/wizard/Wizard";

export function RemindersStep() {
  const wizard = useWizardStep();
  const complete = wizard?.complete;

  return (
    <div className="grid gap-2 text-base max-h-80 overflow-y-scroll text-muted-foreground">
      <h1 className="font-bold text-lg">Important reminders</h1>
      <p>
        Please read the following completely and carefully before starting a new
        recruitement cycle.
      </p>
      <ol className="list-decimal list-inside">
        <li>
          <span className="font-bold">Reviewers and Board Members:</span> Update
          the roles for new reviewers/board members on the user management page.
          Deprecate old reviewers/board members so that they cannot get assigned
          to applications. Reviewers/board members must create an account before
          you can update their roles.
        </li>
        <li>
          <span className="font-bold">Tech assessment:</span> Make sure a new
          tech assessment is ready for the cycle (if necessary). Remember to
          include a tech assessment submit question to the form{" "}
          <span className="font-mono">tech-assessment</span>, set the{" "}
          <span className="font-mono">assessmentTestRepoPath</span> on the form,
          and provide up to date GitHub tokens for the autograder (Professor).
          Work with the DoEs to set this up.
        </li>
        <li>
          <span className="font-bold">Form/Rubric Editing:</span> Click the
          three dots on the form row to access the form and rubric editors.
          Editing after a form is published is strongly discouraged unless
          absolutely necessary. If you do make edits to an active form, limit it
          to only wording edits on existing questions. Never create new
          questions, reorder questions, delete questions, or change IDs on an
          active form.
        </li>
        <li>
          <span className="font-bold">Disabled Roles:</span> You can disable
          applications for certain roles on a form through the editor.
        </li>
        <li>
          <span className="font-bold">Due Dates:</span> Make sure the correct
          due date is set on the form.
        </li>
        <li>
          <span className="font-bold">Rubrics:</span> Forms define the how
          rubric scores are weighted. The score keys defined on the form and
          rubric must match exactly. If they do not, the portal will start
          complaining to you and reviewers
        </li>
        <li>
          <span className="font-bold">Opening applications:</span> Set the form
          to active by toggling the switch on its form row.
        </li>
        <li>
          <span className="font-bold">Releasing decisions:</span> Ensure all
          applicants are decided (accepted, waitlisted, denied). Ensure an
          applicant does not have multiple acceptances for different roles. Deny
          all undecided applicants before releasing decisions.
        </li>
        <li>
          <span className="font-bold">If something breaks:</span> Stop
          immediately and report to the DoEs.
        </li>
      </ol>
      <p>Contact DoEs if you have questions.</p>
      <Button onClick={complete}>I understand</Button>
    </div>
  );
}
