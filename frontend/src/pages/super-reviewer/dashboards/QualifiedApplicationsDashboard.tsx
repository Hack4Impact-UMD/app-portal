import { useMemo, useState } from "react";
import { Button } from "../../../components/ui/button";
import {
  ApplicantRole,
  ApplicationResponse,
  ApplicationStatus,
} from "@/types/types";
import {
  applicantRoleColor,
  applicantRoleDarkColor,
  displayApplicantRoleName,
} from "@/utils/display";
import { useAllApplicationResponsesForForm } from "@/hooks/useApplicationResponses";
import { useParams } from "react-router-dom";
import Loading from "../../../components/Loading";
import useSearch from "@/hooks/useSearch";
import { useQuery } from "@tanstack/react-query";
import { QualifiedApplicationsTable } from "@/components/dor/QualifiedDashboard";
import { getQualifiedStatusesForForm } from "@/services/statusService";

export default function QualifiedApplicationsDashboard() {
  const { formId } = useParams<{ formId: string }>();
  const [roleFilter, setRoleFilter] = useState<"all" | ApplicantRole>("all");
  const { search } = useSearch();

  // Get all qualified statuses for this form
  const {
    data: qualifiedStatuses,
    isPending: statusesPending,
    error: statusesError,
  } = useQuery({
    queryKey: ["qualified-statuses", formId],
    enabled: !!formId,
    queryFn: () => {
      if (!formId) throw new Error("formId is required");
      return getQualifiedStatusesForForm(formId);
    },
    refetchOnWindowFocus: true, // Refetch when user switches back to this tab
  });

  // Get all application responses for this form
  const {
    data: apps,
    isPending: appsPending,
    error: appsError,
  } = useAllApplicationResponsesForForm(formId);

  // Expand apps by role, as in SuperReviewerApplicationsDashboard
  const expandedSubmittedApps = useMemo(
    () =>
      apps
        ?.filter((app) => app.status !== ApplicationStatus.InProgress)
        ?.flatMap((app) =>
          app.rolesApplied.map(
            (role) =>
              ({
                ...app,
                rolesApplied: [role],
              }) as ApplicationResponse,
          ),
        ) ?? [],
    [apps],
  );

  // Filter to only those with qualified status
  const qualifiedApps = useMemo(() => {
    if (!qualifiedStatuses || !expandedSubmittedApps) return [];
    const qualifiedSet = new Set(
      qualifiedStatuses.map((s) => `${s.responseId}:${s.role}`),
    );
    return expandedSubmittedApps.filter((app) =>
      qualifiedSet.has(`${app.id}:${app.rolesApplied[0]}`),
    );
  }, [qualifiedStatuses, expandedSubmittedApps]);

  // Role counts for summary cards
  const applicationsByRole = useMemo(() => {
    const freqs: Map<ApplicantRole, number> = new Map();
    qualifiedApps.forEach((app) => {
      const role = app.rolesApplied[0];
      freqs.set(role, (freqs.get(role) ?? 0) + 1);
    });
    return freqs;
  }, [qualifiedApps]);

  // Use the same order as SuperReviewerApplicationsDashboard
  const roleOrder = Object.values(ApplicantRole);

  if (!formId) return <p>No formId found! The url is probably malformed.</p>;
  if (statusesError)
    return <p>Something went wrong: {statusesError.message}</p>;
  if (appsError) return <p>Something went wrong: {appsError.message}</p>;
  if (statusesPending || appsPending) return <Loading />;

  return (
    <div>
      <div className="overflow-x-scroll flex flex-row gap-2 items-center min-h-28 justify-stretch mt-4 no-scrollbar">
        <Button
          className={`h-28 min-w-40 text-white p-4 flex flex-col items-start 
					${roleFilter === "all" ? "bg-[#4A280D] hover:bg-[#4A280D]/90 text-[#F1D5C4]" : "bg-[#F1D5C4] hover:bg-[#F1D5C4]/90 text-[#4A280D]"}`}
          onClick={() => setRoleFilter("all")}
        >
          <span className="text-3xl">{qualifiedApps.length}</span>
          <span className="mt-auto">Total Applications</span>
        </Button>
        {roleOrder.map((role) => {
          const dark = applicantRoleDarkColor(role) ?? "#000000";
          const light = applicantRoleColor(role) ?? "#FFFFFF";
          const active = roleFilter === role;

          return (
            <Button
              className={`h-28 min-w-40 p-4 flex flex-col items-start`}
              style={{
                backgroundColor: active ? dark : light,
                color: active ? light : dark,
              }}
              onClick={() => setRoleFilter(role)}
              key={role}
            >
              <span className="text-3xl">
                {applicationsByRole.get(role) ?? 0}
              </span>
              <span className="mt-auto">{displayApplicantRoleName(role)}</span>
            </Button>
          );
        })}
      </div>
      <QualifiedApplicationsTable
        applications={qualifiedApps}
        formId={formId}
        search={search}
        roleFilter={roleFilter}
      />
    </div>
  );
}
