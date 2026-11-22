import { ApplicantRole } from "@app-portal/shared/constants";
import { useMemo, useState } from "react";
import { useParams } from "react-router-dom";

import { BoardInterviewsTable } from "@/components/dor/BoardInterviewsDashboard";
import { useRows } from "@/components/dor/QualifiedDashboard/useRows";
import Loading from "@/components/Loading";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import useSearch from "@/hooks/useSearch";
import type { BoardUserProfile } from "@/types/types";
import {
  applicantRoleColor,
  applicantRoleDarkColor,
  displayApplicantRoleName,
} from "@/utils/display";

export default function BoardInterviewsDashboard() {
  const { user } = useAuth();
  const { formId } = useParams<{ formId: string }>();
  const [roleFilter, setRoleFilter] = useState<"all" | ApplicantRole>("all");
  const { search } = useSearch();

  const boardUser = user as BoardUserProfile;
  const allowedRoles = boardUser?.applicantRoles ?? [];

  const { data: rows, isPending, error } = useRows(formId);

  const applicationsByRole = useMemo(() => {
    const freqs: Map<ApplicantRole, number> = new Map();
    rows?.forEach((row) => {
      freqs.set(row.role, (freqs.get(row.role) ?? 0) + 1);
    });
    return freqs;
  }, [rows]);

  // Use the same order as SuperReviewerApplicationsDashboard
  const roleOrder = Object.values(ApplicantRole).filter((role) =>
    allowedRoles.includes(role),
  );

  if (!formId) return <p>No formId found! The url is probably malformed.</p>;
  if (error) return <p>Something went wrong: {error.message}</p>;
  if (isPending || !rows) return <Loading />;

  return (
    <div>
      <div className="overflow-x-scroll flex flex-row gap-2 items-center min-h-28 justify-stretch mt-4 no-scrollbar">
        <Button
          className={`h-28 min-w-40 text-white p-4 flex flex-col items-start 
					${roleFilter === "all" ? "bg-[#4A280D] hover:bg-[#4A280D]/90 text-[#F1D5C4]" : "bg-[#F1D5C4] hover:bg-[#F1D5C4]/90 text-[#4A280D]"}`}
          onClick={() => setRoleFilter("all")}
        >
          <span className="text-3xl">{rows.length}</span>
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
      <BoardInterviewsTable
        formId={formId}
        search={search}
        roleFilter={roleFilter}
      />
    </div>
  );
}
