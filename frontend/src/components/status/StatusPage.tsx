import { ApplicantRole, ReviewStatus } from "@app-portal/shared/constants";
import { Fragment, useMemo, useState } from "react";
import Timeline from "./Timeline.tsx";
import type { ApplicationResponse } from "../../types/types.ts";
import { useApplicationResponsesAndSemesters } from "../../hooks/useApplicationResponseAndSemesters.ts";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth.ts";
import { getApplicationResponseAndSemester } from "@/services/applicationResponseAndSemesterService.ts";
import { getApplicationStatus } from "@/services/statusService.ts";
import { ApplicationResponseRow } from "./ApplicationResponseRow.tsx";

const fullTimelineItems = [
  { label: "Submitted", id: ReviewStatus.NotReviewed },
  { label: "Under Review", id: ReviewStatus.UnderReview },
  { label: "Interview", id: ReviewStatus.Interview },
  { label: "Decided", id: "decided" },
];

const bootcampTimelineItems = [
  { label: "Submitted", id: ReviewStatus.NotReviewed },
  { label: "Under Review", id: ReviewStatus.UnderReview },
  { label: "Decided", id: "decided" },
];

function useTimelineStep() {
  const { token, user } = useAuth();
  return useQuery({
    queryKey: ["timeline", token],
    enabled: !!user && !!token,
    queryFn: async () => {
      if (!user || !token) return 0;

      const applications = await getApplicationResponseAndSemester(user.id);
      const activeApps = applications.filter((app) => app.active);

      const allRoles = activeApps.flatMap((app) => app.rolesApplied);
      const isOnlyBootcamp =
        allRoles.length === 1 && allRoles[0] === ApplicantRole.Bootcamp;

      const appStatuses = await Promise.all(
        activeApps.flatMap((app) =>
          app.rolesApplied.map(async (role) =>
            getApplicationStatus((await token()) ?? "", app.id, role),
          ),
        ),
      );

      let status = 0;
      for (const appStatus of appStatuses) {
        if (
          appStatus.status === "decided" ||
          appStatus.status === ReviewStatus.Accepted ||
          appStatus.status === ReviewStatus.Waitlisted ||
          appStatus.status === ReviewStatus.Denied
        ) {
          status = Math.max(isOnlyBootcamp ? 2 : 3, status);
        } else if (appStatus.status === ReviewStatus.Interview) {
          if (!isOnlyBootcamp) {
            status = Math.max(2, status);
          }
        } else if (appStatus.status === ReviewStatus.UnderReview) {
          status = Math.max(1, status);
        }
      }

      return status;
    },
  });
}

function StatusPage() {
  const [activeTab, setActiveTab] = useState<"active" | "inactive">("active");
  const {
    data: applications,
    isPending,
    error,
  } = useApplicationResponsesAndSemesters();

  const activeApplications = useMemo(
    () => applications.filter((app) => app.active) ?? [],
    [applications],
  );

  const inactiveApplications = useMemo(
    () => applications.filter((app) => !app.active) ?? [],
    [applications],
  );

  const activeList =
    activeTab === "active" ? activeApplications : inactiveApplications;
  const semesterGrouping = activeList.reduce((map, application) => {
    const semester = application.semester;

    if (!map.has(semester)) {
      map.set(semester, []);
    }

    map.get(semester)!.push(application);
    return map;
  }, new Map<string, ApplicationResponse[]>());

  const { data: currentTimelineStep } = useTimelineStep();

  // Determine if only bootcamp is applied
  const isOnlyBootcamp = useMemo(() => {
    if (!activeApplications.length) return false;

    const allRoles = activeApplications.flatMap((app) => app.rolesApplied);
    return allRoles.length === 1 && allRoles[0] === ApplicantRole.Bootcamp;
  }, [activeApplications]);

  const timelineItems = useMemo(() => {
    return isOnlyBootcamp ? bootcampTimelineItems : fullTimelineItems;
  }, [isOnlyBootcamp]);

  const maxStepReached = isOnlyBootcamp ? 2 : 3;

  return (
    <div className="flex grow flex-col">
      <div className="h-full">
        <div className="bg-white p-6 w-full max-w-5xl mx-auto m-8 rounded-md shadow">
          <h1 className="text-xl mt-10 mb-10 font-semibold">My Applications</h1>

          <div className="border-b border-gray-300">
            <div className="flex gap-8">
              <button
                onClick={() => setActiveTab("active")}
                className={`relative pb-4 px-1 cursor-pointer ${
                  activeTab === "active" ? "text-blue-500" : "text-gray-500"
                }`}
                style={{ background: "none", border: "none", outline: "none" }}
              >
                Active (
                {activeApplications.reduce(
                  (sum, application) => sum + application.rolesApplied.length,
                  0,
                )}
                )
                {activeTab === "active" && (
                  <div className="absolute bottom-0 left-2 right-2 h-1.5 bg-blue-500 rounded-t-full" />
                )}
              </button>
              <button
                onClick={() => setActiveTab("inactive")}
                className={`relative pb-4 px-1 cursor-pointer ${
                  activeTab === "inactive" ? "text-blue-500" : "text-gray-500"
                }`}
                style={{ background: "none", border: "none", outline: "none" }}
              >
                Inactive (
                {inactiveApplications.reduce(
                  (sum, application) => sum + application.rolesApplied.length,
                  0,
                )}
                )
                {activeTab === "inactive" && (
                  <div className="absolute bottom-0 left-2 right-2 h-1.5 bg-blue-500 rounded-t-full" />
                )}
              </button>
            </div>
          </div>

          <div className="mt-5">
            {activeTab === "active" && (
              <Timeline
                currentStep={currentTimelineStep ?? 0}
                items={timelineItems}
                maxStepReached={maxStepReached}
              />
            )}
          </div>

          <div className="mt-3">
            {isPending ? (
              <p className="w-full">Loading...</p>
            ) : error ? (
              <p className="w-full">
                Error fetching applications: {error.message}
              </p>
            ) : activeList.length === 0 ? (
              <p className="w-full">
                You don't have any {activeTab} applications. Go apply!
              </p>
            ) : activeTab === "inactive" ? (
              Array.from(semesterGrouping.entries()).map(
                ([semester, apps], index) => (
                  <div key={index}>
                    <h2 className="text-lg font-semibold mt-6 mb-2">
                      Hack4Impact {semester} Application
                    </h2>
                    <table className="w-full">
                      <thead>
                        <tr className="border-t border-gray-300">
                          <th className="pb-4 pt-4 text-left font-normal w-1/3">
                            Application
                          </th>
                          <th className="pb-4 pt-4 text-center font-normal w-1/4">
                            Application Status
                          </th>
                          <th className="pb-4 pt-4 text-center font-normal w-1/4">
                            Date Submitted
                          </th>
                          <th className="pb-4 pt-4 text-center font-normal w-1/6">
                            Action
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {apps.map((application) => (
                          <Fragment key={application.id}>
                            {application.rolesApplied.map((role) => (
                              <ApplicationResponseRow
                                key={application.id + role}
                                response={application}
                                role={role}
                              />
                            ))}
                          </Fragment>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ),
              )
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="border-t border-gray-300">
                    <th className="pb-4 pt-4 text-left font-normal w-1/2">
                      Application
                    </th>
                    <th className="pb-4 pt-4 text-center font-normal w-1/6">
                      Application Status
                    </th>
                    <th className="pb-4 pt-4 text-center font-normal w-1/6">
                      Date Submitted
                    </th>
                    <th className="pb-4 pt-4 text-center font-normal w-1/6">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {activeList.map((application) => (
                    <Fragment key={application.id}>
                      {application.rolesApplied.map((role) => (
                        <ApplicationResponseRow
                          key={application.id + role}
                          response={application}
                          role={role}
                        />
                      ))}
                    </Fragment>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default StatusPage;
