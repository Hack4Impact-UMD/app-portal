import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  RadioIcon,
  ShieldIcon,
  StopCircleIcon,
  ChevronDownIcon,
  CheckIcon,
} from "lucide-react";
import { useMemo, useState } from "react";
import { Outlet, useParams, useLocation, NavLink } from "react-router-dom";

import { qualifiedRowsQueryRoot } from "@/components/dor/QualifiedDashboard/useRows";
import { throwErrorToast } from "@/components/toasts/ErrorToast";
import { throwSuccessToast } from "@/components/toasts/SuccessToast";
import {
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogTitle,
  AlertDialog,
  AlertDialogHeader,
  AlertDialogTrigger,
  AlertDialogDescription,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenuContent,
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { formQueries, useApplicationForm } from "@/hooks/useApplicationForm";
import useSearch from "@/hooks/useSearch";
import { setFormDecisionRelease } from "@/services/applicationFormsService";
import {
  getAllApplicationStatusesForForm,
  isDecided,
  rejectUndecidedApplicantsForForm,
} from "@/services/statusService";

export default function SuperReviewerDashboardShell() {
  const { search, setSearch } = useSearch();
  const { formId } = useParams<{ formId: string }>();
  const location = useLocation();
  const {
    data: form,
    isPending: formPending,
    error: formError,
  } = useApplicationForm(formId);
  const queryClient = useQueryClient();
  const [releaseConfirm, setReleaseConfirm] = useState("");

  const releaseDecisionsMutation = useMutation({
    mutationFn: async ({ released }: { released: boolean }) => {
      setReleaseConfirm("");
      if (!formId) throw new Error("Invalid form ID");

      const statuses = await getAllApplicationStatusesForForm(formId);

      if (statuses.some((s) => !isDecided(s.status))) {
        throw new Error(
          "Some applicants have not been decided yet. Can't release decisions.",
        );
      }

      await setFormDecisionRelease(formId, released);
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: formQueries.detail(formId).queryKey,
      });
    },
    onError: (err) => {
      console.log(err);
      throwErrorToast(
        `Failed to release decisions: ${err.name} - ${err.message}`,
      );
    },
    onSuccess: () => {
      throwSuccessToast("Successfully released decisions!");
    },
  });

  const rejectUndecidedMutation = useMutation({
    mutationFn: async () => {
      if (!formId) throw new Error("Invalid form ID");
      await rejectUndecidedApplicantsForForm(formId);
    },
    onError: (err) => {
      console.log(err);
      throwErrorToast(`Failed to reject undecided applicants: ${err.message}`);
    },
    onSuccess: () => {
      throwSuccessToast("Successfully updated applicant statuses!");
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: qualifiedRowsQueryRoot,
      });
    },
  });

  const isActiveRoute = (path: string) => {
    return location.pathname === path;
  };

  const base = `/admin/dor/dashboard/${formId}`;

  const applicationsRoutes = useMemo(
    () => [
      {
        path: `${base}/all`,
        label: "All Applications",
        category: "Applications",
      },
      {
        path: `${base}/qualified`,
        label: "Qualified",
        category: "Applications",
      },
      {
        path: `${base}/acceptance-confirmation`,
        label: "Confirmations",
        category: "Applications",
      },
    ],
    [base],
  );

  const assignmentsRoutes = useMemo(
    () => [
      {
        path: `${base}/assigned-reviews`,
        label: "Assigned Reviews",
        category: "My Assignments",
      },
      {
        path: `${base}/assigned-interviews`,
        label: "Assigned Interviews",
        category: "My Assignments",
      },
    ],
    [base],
  );

  const usersRoutes = useMemo(
    () => [
      { path: `${base}/reviewers`, label: "Reviewers", category: "Users" },
      {
        path: `${base}/interviewers`,
        label: "Interviewers",
        category: "Users",
      },
      { path: `${base}/board`, label: "Board", category: "Users" },
    ],
    [base],
  );

  const allRoutes = useMemo(
    () => [...applicationsRoutes, ...assignmentsRoutes, ...usersRoutes],
    [applicationsRoutes, assignmentsRoutes, usersRoutes],
  );

  const currentPage = useMemo(
    () => allRoutes.find((r) => r.path === location.pathname),
    [allRoutes, location.pathname],
  );

  return (
    <div className="w-full grow bg-lightgray flex flex-col items-center p-2 py-4">
      <div className="max-w-5xl w-full rounded bg-white p-4 flex flex-col gap-2">
        <div className="flex gap-2 flex-row items-center">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant={
                  applicationsRoutes.some((r) => isActiveRoute(r.path))
                    ? "default"
                    : "outline"
                }
                className="gap-1"
              >
                Applications
                <ChevronDownIcon className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuLabel>Applications</DropdownMenuLabel>
              {applicationsRoutes.map((route) => (
                <DropdownMenuItem key={route.path} asChild>
                  <NavLink
                    to={route.path}
                    className={({ isActive }) =>
                      `cursor-pointer flex items-center justify-between ${isActive ? "bg-accent" : ""}`
                    }
                  >
                    <span>{route.label}</span>
                    {isActiveRoute(route.path) && (
                      <CheckIcon className="h-4 w-4" />
                    )}
                  </NavLink>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant={
                  assignmentsRoutes.some((r) => isActiveRoute(r.path))
                    ? "default"
                    : "outline"
                }
                className="gap-1"
              >
                My Assignments
                <ChevronDownIcon className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuLabel>My Assignments</DropdownMenuLabel>
              {assignmentsRoutes.map((route) => (
                <DropdownMenuItem key={route.path} asChild>
                  <NavLink
                    to={route.path}
                    className={({ isActive }) =>
                      `cursor-pointer flex items-center justify-between ${isActive ? "bg-accent" : ""}`
                    }
                  >
                    <span>{route.label}</span>
                    {isActiveRoute(route.path) && (
                      <CheckIcon className="h-4 w-4" />
                    )}
                  </NavLink>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant={
                  usersRoutes.some((r) => isActiveRoute(r.path))
                    ? "default"
                    : "outline"
                }
                className="gap-1"
              >
                Users
                <ChevronDownIcon className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuLabel>Users</DropdownMenuLabel>
              {usersRoutes.map((route) => (
                <DropdownMenuItem key={route.path} asChild>
                  <NavLink
                    to={route.path}
                    className={({ isActive }) =>
                      `cursor-pointer flex items-center justify-between ${isActive ? "bg-accent" : ""}`
                    }
                  >
                    <span>{route.label}</span>
                    {isActiveRoute(route.path) && (
                      <CheckIcon className="h-4 w-4" />
                    )}
                  </NavLink>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <Dialog open={rejectUndecidedMutation.isPending}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Please wait</DialogTitle>
                <DialogDescription>
                  Rejecting undecided applicants...
                </DialogDescription>
              </DialogHeader>
            </DialogContent>
          </Dialog>
          <AlertDialog>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant={"outline"} size="icon">
                  <ShieldIcon />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuLabel>Admin Actions</DropdownMenuLabel>
                <DropdownMenuItem
                  className="cursor-pointer"
                  variant="destructive"
                  onClick={() => rejectUndecidedMutation.mutate()}
                >
                  <StopCircleIcon />
                  Deny all undecided applicants
                </DropdownMenuItem>
                <AlertDialogTrigger asChild>
                  <DropdownMenuItem
                    className="cursor-pointer"
                    disabled={
                      !form ||
                      form.decisionsReleased ||
                      releaseDecisionsMutation.isPending
                    }
                  >
                    {formPending ? (
                      "Loading..."
                    ) : formError ? (
                      "Failed to load form"
                    ) : form.decisionsReleased ? (
                      "Decisions already released"
                    ) : (
                      <>
                        <RadioIcon />
                        Release decisions for this form
                      </>
                    )}
                  </DropdownMenuItem>
                </AlertDialogTrigger>
              </DropdownMenuContent>
            </DropdownMenu>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Confirm decision release</AlertDialogTitle>
                <AlertDialogDescription>
                  Releasing decisions will immediately make them viewable on
                  applicant decision pages.
                  <strong> To confirm this action, type "I confirm"</strong>
                </AlertDialogDescription>
                <Input
                  placeholder="I confirm"
                  value={releaseConfirm}
                  onChange={(e) => setReleaseConfirm(e.target.value)}
                />
                <AlertDialogAction
                  disabled={releaseConfirm !== "I confirm"}
                  onClick={() =>
                    releaseDecisionsMutation.mutate({
                      released: true,
                    })
                  }
                >
                  Confirm
                </AlertDialogAction>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
              </AlertDialogHeader>
            </AlertDialogContent>
          </AlertDialog>
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border border-gray-300 rounded-full px-2 py-1 text-sm w-full max-w-md ml-auto"
            placeholder="Search"
          />
        </div>

        {currentPage && (
          <div className="text-sm text-muted-foreground px-1">
            <span className="font-medium">{currentPage.category}</span>
            <span className="mx-1">›</span>
            <span>{currentPage.label}</span>
          </div>
        )}
        <Outlet />
      </div>
    </div>
  );
}
