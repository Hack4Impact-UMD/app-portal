import { ChevronDownIcon, CheckIcon } from "lucide-react";
import { useMemo } from "react";
import { Outlet, useParams, useLocation, NavLink } from "react-router-dom";

import { Button } from "@/components/ui/button";
import {
  DropdownMenuContent,
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import useSearch from "@/hooks/useSearch";

export default function BoardDashboardShell() {
  const { search, setSearch } = useSearch();
  const { formId } = useParams<{ formId: string }>();
  const location = useLocation();

  const isActiveRoute = (path: string) => {
    return location.pathname === path;
  };

  const base = `/admin/board/dashboard/${formId}`;

  const applicationsRoutes = useMemo(
    () => [
      {
        path: `${base}/all`,
        label: "All Applications",
        category: undefined,
      },
      {
        path: `${base}/interviews`,
        label: "Interviews",
        category: undefined,
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

  const allRoutes = useMemo(
    () => [...applicationsRoutes, ...assignmentsRoutes],
    [applicationsRoutes, assignmentsRoutes],
  );

  const currentPage = useMemo(
    () => allRoutes.find((r) => r.path === location.pathname),
    [allRoutes, location.pathname],
  );

  return (
    <div className="w-full grow bg-lightgray flex flex-col items-center p-2 py-4">
      <div className="max-w-5xl w-full rounded bg-white p-4 flex flex-col gap-2">
        <div className="flex gap-2 flex-row items-center">
          {applicationsRoutes.map((route) => (
            <NavLink key={route.path} to={route.path}>
              {({ isActive }) => (
                <Button asChild variant={isActive ? "default" : "outline"}>
                  <a>{route.label}</a>
                </Button>
              )}
            </NavLink>
          ))}

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

          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border border-gray-300 rounded-full px-2 py-1 text-sm w-full max-w-md ml-auto"
            placeholder="Search"
          />
        </div>

        {currentPage?.category && (
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
