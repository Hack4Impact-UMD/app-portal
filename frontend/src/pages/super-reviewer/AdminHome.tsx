import { PermissionRole } from "@app-portal/shared/constants";
import {
  BanIcon,
  CalendarClockIcon,
  EllipsisVertical,
  LockIcon,
  MailIcon,
  MailOpenIcon,
  PlusIcon,
  UnlockIcon,
  UserPlusIcon,
  UsersIcon,
} from "lucide-react";
import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import { Link, useNavigate } from "react-router-dom";

import UploadInterviewRubricDialog from "@/components/admin/UploadInterviewRubricDialog";
import UploadReviewRubricDialog from "@/components/admin/UploadReviewRubricDialog";
import ChangeDueDateDialog from "@/components/dor/ChangeDueDateDialog/ChangeDueDateDialog";
import { CreateFormWizard } from "@/components/dor/CreateFormWizard/CreateFormWizard";
import DuplicateFormDialog from "@/components/dor/DuplicateFormDialog/DuplicateFormDialog";
import InviteUsersDialog from "@/components/dor/InviteUsersDialog/InviteUsersDialog";
import CreateInternalApplicantDialog from "@/components/reviewer/CreateInternalApplicantDialog";
import Spinner from "@/components/Spinner";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Switch } from "@/components/ui/switch";
import {
  TooltipContent,
  Tooltip,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  useAllApplicationForms,
  useUpdateApplicationFormActive,
} from "@/hooks/useApplicationForm";
import { useAuth } from "@/hooks/useAuth";
import { useUsers } from "@/hooks/useUsers";
import { cn } from "@/lib/utils";
import type { ApplicationForm } from "@/types/types";
import {
  displayApplicantRoleNameNoEmoji,
  displayRelativeTime,
  displayUserRoleName,
} from "@/utils/display";
import { isPrivateForm } from "@/utils/form";

type FormAction = "duplicate" | "dueDate" | "invite";

export default function AdminHome() {
  const navigate = useNavigate();
  const { data: forms, isPending, error } = useAllApplicationForms();
  const { user } = useAuth();
  const isSuperReviewer = user?.role === PermissionRole.SuperReviewer;
  const { data: users } = useUsers(isSuperReviewer);
  const [selectedForm, setSelectedForm] = useState<ApplicationForm>();
  const [showDuplicateDialog, setShowDuplicateDialog] = useState(false);
  const [showDueDateDialog, setShowDueDateDialog] = useState(false);
  const [showInviteUsersDialog, setShowInviteUsersDialog] = useState(false);
  const [formsLocked, setFormsLocked] = useState(true);
  const [formWizardOpen, setFormWizardOpen] = useState(false);

  const { mutate: setFormActiveStatus, isPending: activePending } =
    useUpdateApplicationFormActive();

  const userNameById = useMemo(() => {
    const map = new Map<string, string>();
    users?.forEach((u) => map.set(u.id, `${u.firstName} ${u.lastName}`));
    return map;
  }, [users]);

  const { publicForms, privateForms } = useMemo(() => {
    // Copy before sorting: sorting in place would mutate the query cache.
    const sorted = [...(forms ?? [])].sort(
      (a, b) =>
        b.dueDate.toMillis() - a.dueDate.toMillis() ||
        b.semester.localeCompare(a.semester),
    );
    return {
      publicForms: sorted.filter((f) => !isPrivateForm(f)),
      privateForms: sorted.filter(isPrivateForm),
    };
  }, [forms]);

  if (!user)
    return (
      <div className="flex items-center justify-center p-4 w-full h-full">
        <Spinner />
      </div>
    );

  const route =
    user.role === PermissionRole.Reviewer
      ? "reviewer"
      : user.role === PermissionRole.Board
        ? "board"
        : "dor";
  const table = user.role === PermissionRole.Reviewer ? "apps" : "all";

  if (isPending)
    return (
      <div className="flex items-center justify-center p-4 w-full h-full">
        <Spinner />
      </div>
    );
  if (error) return <p>Failed to fetch forms: {error.message}</p>;

  const onAction = (form: ApplicationForm, action: FormAction) => {
    setSelectedForm(form);
    if (action === "duplicate") setShowDuplicateDialog(true);
    else if (action === "dueDate") setShowDueDateDialog(true);
    else setShowInviteUsersDialog(true);
  };

  const renderRow = (form: ApplicationForm) => (
    <FormRow
      key={form.id}
      form={form}
      href={`/admin/${route}/dashboard/${form.id}/${table}`}
      isSuperReviewer={isSuperReviewer}
      userNameById={userNameById}
      controlsDisabled={formsLocked}
      activePending={activePending}
      onActiveChange={(active) => setFormActiveStatus({ id: form.id, active })}
      onAction={(action) => onAction(form, action)}
    />
  );

  const showPrivateSection = isSuperReviewer || privateForms.length > 0;

  return (
    <div className="w-full grow px-4 py-8 flex flex-col gap-6 bg-lightgray items-center">
      <header className="max-w-7xl w-full">
        <h1 className="text-3xl font-bold text-black">
          Welcome, {user.firstName}!
        </h1>
        <p className="text-muted-foreground">
          You're signed in as a {displayUserRoleName(user.role)}.
        </p>
      </header>

      <section className="max-w-7xl w-full p-5 sm:p-6 bg-white rounded-lg">
        <div className="flex flex-col sm:flex-row sm:items-start gap-4">
          <div className="grow">
            <h2 className="text-xl font-semibold text-black">
              Review dashboards
            </h2>
            <p className="text-muted-foreground">
              Choose a form to see its applications and reviews.
            </p>
          </div>
          {isSuperReviewer && (
            <>
              <Button
                variant="outline"
                size="sm"
                aria-pressed={!formsLocked}
                onClick={() => setFormsLocked((l) => !l)}
                className={cn(
                  "self-start",
                  !formsLocked && "border-blue text-blue hover:text-blue",
                )}
              >
                {formsLocked ? (
                  <LockIcon className="size-4" />
                ) : (
                  <UnlockIcon className="size-4" />
                )}
                {formsLocked ? "Unlock form settings" : "Lock form settings"}
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={() => setFormWizardOpen(true)}
              >
                <PlusIcon className="size-4" /> Create New Form
              </Button>
              <CreateFormWizard
                open={formWizardOpen}
                setOpen={setFormWizardOpen}
              />
            </>
          )}
        </div>

        <FormSection
          title="Public forms"
          count={publicForms.length}
          description="Open to every applicant while accepting applications."
        >
          {publicForms.length > 0 ? (
            <ul className="flex flex-col gap-2">
              {publicForms.map(renderRow)}
            </ul>
          ) : (
            <EmptyState>No public forms yet.</EmptyState>
          )}
        </FormSection>

        {showPrivateSection && (
          <FormSection
            title="Private forms"
            count={privateForms.length}
            description="Hidden from applicants except the people invited."
          >
            {privateForms.length > 0 ? (
              <ul className="flex flex-col gap-2">
                {privateForms.map(renderRow)}
              </ul>
            ) : (
              <EmptyState>
                No private forms yet. Use "Create New Form" and mark it private
                to invite specific applicants, like a late round or internal
                transfer.
              </EmptyState>
            )}
          </FormSection>
        )}
      </section>

      {(user.role === PermissionRole.Board || isSuperReviewer) && (
        <div className="max-w-7xl w-full grid gap-6 md:grid-cols-2">
          <ToolPanel
            title="Autograder runs"
            description="Watch grading jobs live and submit new ones."
          >
            <Button onClick={() => navigate("/admin/autograder")}>
              View autograder runs
            </Button>
          </ToolPanel>

          {isSuperReviewer && (
            <>
              <ToolPanel
                title="Users"
                description="See registered users, grant reviewer access, edit roles, and delete accounts."
              >
                <Button onClick={() => navigate("/admin/dor/users")}>
                  Manage users
                </Button>
                <CreateInternalApplicantDialog />
              </ToolPanel>
              <ToolPanel
                title="Rubrics"
                description="Upload application and interview rubrics."
                className="md:col-span-2"
              >
                <UploadReviewRubricDialog />
                <UploadInterviewRubricDialog />
              </ToolPanel>
            </>
          )}
        </div>
      )}

      {isSuperReviewer && (
        <>
          {selectedForm && (
            <>
              <DuplicateFormDialog
                open={showDuplicateDialog}
                form={selectedForm}
                onOpenChange={setShowDuplicateDialog}
              />
              <ChangeDueDateDialog
                open={showDueDateDialog}
                form={selectedForm}
                onOpenChange={setShowDueDateDialog}
              />
              <InviteUsersDialog
                open={showInviteUsersDialog}
                form={selectedForm}
                onOpenChange={setShowInviteUsersDialog}
              />
            </>
          )}
        </>
      )}
    </div>
  );
}

function FormSection({
  title,
  count,
  description,
  action,
  children,
}: {
  title: string;
  count: number;
  description: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="mt-6">
      <div className="flex flex-wrap items-end gap-x-4 gap-y-2 mb-3">
        <div className="grow">
          <h3 className="text-base font-semibold text-black flex items-center gap-2">
            {title}
            <span className="text-xs font-medium text-darkgray bg-lightgray rounded-full px-2 py-0.5 tabular-nums">
              {count}
            </span>
          </h3>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}

function EmptyState({ children }: { children: ReactNode }) {
  return (
    <p className="text-sm text-muted-foreground border border-dashed border-gray-300 rounded-md px-4 py-6 text-center">
      {children}
    </p>
  );
}

function ToolPanel({
  title,
  description,
  className,
  children,
}: {
  title: string;
  description: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <section
      className={cn(
        "p-5 sm:p-6 bg-white rounded-lg flex flex-col gap-4",
        className,
      )}
    >
      <div className="grow">
        <h2 className="text-lg font-semibold text-black">{title}</h2>
        <p className="text-muted-foreground text-sm">{description}</p>
      </div>
      <div className="flex flex-wrap gap-2">{children}</div>
    </section>
  );
}

const dueDateFormat = new Intl.DateTimeFormat("en-US", {
  weekday: "short",
  month: "short",
  day: "numeric",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

function FormRow({
  form,
  href,
  isSuperReviewer,
  userNameById,
  controlsDisabled,
  activePending,
  onActiveChange,
  onAction,
}: {
  form: ApplicationForm;
  href: string;
  isSuperReviewer: boolean;
  userNameById: Map<string, string>;
  controlsDisabled: boolean;
  activePending: boolean;
  onActiveChange: (active: boolean) => void;
  onAction: (action: FormAction) => void;
}) {
  const dueDate = form.dueDate.toDate();
  const isPastDue = dueDate.getTime() < Date.now();
  const isPrivate = isPrivateForm(form);
  const invited = form.invitedUsers ?? [];
  const disabledRoles = form.disabledRoles ?? [];

  return (
    <li
      className={cn(
        "flex flex-col sm:flex-row rounded-md border bg-white transition-colors hover:bg-gray",
        form.isActive ? "border-blue/40" : "border-gray-200",
      )}
    >
      <Link
        to={href}
        className="grow min-w-0 flex flex-col sm:flex-row sm:items-center gap-3 px-4 py-3 rounded-md focus-visible:outline-2 focus-visible:outline-blue"
      >
        <div className="grow min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-base font-semibold text-black">
              {form.semester}
            </span>
            {form.isActive ? (
              <span className="text-xs font-medium text-darkblue bg-lightblue rounded-full px-2 py-0.5">
                Accepting applications
              </span>
            ) : (
              <span className="text-xs font-medium text-darkgray bg-lightgray rounded-full px-2 py-0.5">
                Closed
              </span>
            )}
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
            <span
              className={cn(
                "flex items-center gap-1.5",
                form.decisionsReleased && "text-blue",
              )}
            >
              {form.decisionsReleased ? (
                <MailOpenIcon className="size-4" />
              ) : (
                <MailIcon className="size-4" />
              )}
              {form.decisionsReleased
                ? "Decisions released"
                : "Decisions not released"}
            </span>
            {isPrivate && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="flex items-center gap-1.5 cursor-default">
                    <UsersIcon className="size-4" />
                    {invited.length} invited
                  </span>
                </TooltipTrigger>
                <TooltipContent className="max-w-64">
                  {!isSuperReviewer ? (
                    `${invited.length} user(s) invited`
                  ) : invited.length > 0 ? (
                    <ul>
                      {invited.map((id) => (
                        <li key={id}>{userNameById.get(id) ?? id}</li>
                      ))}
                    </ul>
                  ) : (
                    "No one invited yet"
                  )}
                </TooltipContent>
              </Tooltip>
            )}
            {disabledRoles.length > 0 && (
              <span className="flex items-center gap-1.5">
                <BanIcon className="size-4" />
                Closed to{" "}
                {disabledRoles.map(displayApplicantRoleNameNoEmoji).join(", ")}
              </span>
            )}
            <span className="font-mono text-xs truncate">{form.id}</span>
          </div>
        </div>

        <div className="shrink-0 flex flex-wrap items-baseline sm:flex-col sm:items-end gap-x-2 text-sm">
          <span className="flex items-center gap-1.5 text-black whitespace-nowrap">
            <CalendarClockIcon className="size-4 text-muted-foreground" />
            {dueDateFormat.format(dueDate)}
          </span>
          <span
            className={cn(
              "text-xs",
              isPastDue ? "text-muted-foreground" : "text-blue font-medium",
            )}
          >
            {isPastDue ? "Was due" : "Due"} {displayRelativeTime(dueDate)}
          </span>
        </div>
      </Link>

      {isSuperReviewer && (
        <div className="flex items-center gap-3 px-4 py-2 sm:py-0 border-t sm:border-t-0 sm:border-l border-gray-200">
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="flex">
                <Switch
                  aria-label={`Accepting applications for ${form.semester}`}
                  checked={form.isActive}
                  disabled={activePending || controlsDisabled}
                  onCheckedChange={onActiveChange}
                />
              </span>
            </TooltipTrigger>
            <TooltipContent>
              {controlsDisabled
                ? "Unlock form settings to change"
                : form.isActive
                  ? "Stop accepting applications"
                  : "Start accepting applications"}
            </TooltipContent>
          </Tooltip>

          <DropdownMenu>
            <DropdownMenuTrigger disabled={controlsDisabled} asChild>
              <Button
                variant="ghost"
                size="icon"
                aria-label={`Settings for ${form.semester}`}
              >
                <EllipsisVertical className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link to={`/admin/dor/form-builder/${form.id}`}>Edit form</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to={`/admin/dor/rubric-builder/${form.id}`}>
                  Edit rubrics
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onAction("duplicate")}>
                Duplicate form
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onAction("dueDate")}>
                Change due date
              </DropdownMenuItem>
              {isPrivate && (
                <DropdownMenuItem onClick={() => onAction("invite")}>
                  <UserPlusIcon className="size-4" />
                  Invite users
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}
    </li>
  );
}
