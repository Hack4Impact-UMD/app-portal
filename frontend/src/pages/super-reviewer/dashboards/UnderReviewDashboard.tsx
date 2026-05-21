import { ApplicantRole } from "@app-portal/shared/types";
import { useMemo, useState } from "react";
import { Button } from "../../../components/ui/button";
import type { ApplicationResponse } from "@/types/types";
import { ApplicationStatus } from "@/types/types";
import {
  applicantRoleColor,
  applicantRoleDarkColor,
  displayApplicantRoleName,
} from "@/utils/display";
import { useAllApplicationResponsesForForm } from "@/hooks/useApplicationResponses";
import { useParams } from "react-router-dom";
import Loading from "../../../components/Loading";
import { UnderReviewTable } from "@/components/dor/UnderReviewDashboard";
import useSearch from "@/hooks/useSearch";

export default function UnderReviewDashboard() {
  const { formId } = useParams<{ formId: string }>();
  const [roleFilter, setRoleFilter] = useState<"all" | ApplicantRole>("all");

  const {
    data: apps,
    isPending,
    error,
  } = useAllApplicationResponsesForForm(formId ?? "");
  const { search } = useSearch();

  const expandedSubmittedApps = useMemo(
    () =>
      apps
        ?.filter((app) => app.status !== ApplicationStatus.InProgress)
        ?.flatMap((app) =>
          app.rolesApplied.map(
            (role): ApplicationResponse => ({
              ...app,
              rolesApplied: [role],
            }),
          ),
        ),
    [apps],
  );

  const applicationsByRole = useMemo(() => {
    const freqs: Map<ApplicantRole, number> = new Map();
    expandedSubmittedApps?.forEach((app) => {
      const role = app.rolesApplied[0];
      freqs.set(role, (freqs.get(role) ?? 0) + 1);
    });

    return freqs;
  }, [expandedSubmittedApps]);

  if (!formId) return <p>No formId found! The url is probably malformed.</p>;
  if (error) return <p>Something went wrong: {error.message}</p>;
  if (isPending || !expandedSubmittedApps) return <Loading />;

  return (
    <div>
      <div className="overflow-x-scroll flex flex-row gap-2 items-center min-h-28 justify-stretch mt-4 no-scrollbar">
        <Button
          className={`h-28 min-w-40 text-white p-4 flex flex-col items-start 
					${roleFilter === "all" ? "bg-[#4A280D] hover:bg-[#4A280D]/90 text-[#F1D5C4]" : "bg-[#F1D5C4] hover:bg-[#F1D5C4]/90 text-[#4A280D]"}`}
          onClick={() => setRoleFilter("all")}
        >
          <span className="text-3xl">{expandedSubmittedApps.length}</span>
          <span className="mt-auto">Total Applications</span>
        </Button>
        {Object.values(ApplicantRole).map((role) => {
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
      <UnderReviewTable
        applications={expandedSubmittedApps}
        formId={formId}
        search={search}
        roleFilter={roleFilter}
      />
    </div>
  );
}
