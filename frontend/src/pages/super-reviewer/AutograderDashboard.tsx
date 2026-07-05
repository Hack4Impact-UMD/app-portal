import {
  GradingJobStatus,
  STANDALONE_GRADING_RESPONSE_ID,
} from "@app-portal/shared/constants";
import type { ColumnDef } from "@tanstack/react-table";
import { createColumnHelper } from "@tanstack/react-table";
import { ExternalLink } from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";

import SubmitGradingJobDialog from "@/components/admin/SubmitGradingJobDialog";
import SubmitStandaloneGradingJobDialog from "@/components/admin/SubmitStandaloneGradingJobDialog";
import type { AutograderStatusIconStatus } from "@/components/autograder/AutograderStatusIcon";
import AutograderStatusIcon from "@/components/autograder/AutograderStatusIcon";
import { DataTable } from "@/components/DataTable";
import Loading from "@/components/Loading";
import SortableHeader from "@/components/tables/SortableHeader";
import { Button } from "@/components/ui/button";
import { useApplicantForResponse } from "@/hooks/useApplicants";
import { useApplicationResponse } from "@/hooks/useApplicationResponses";
import { useRecentGradingJobs } from "@/hooks/useGrading";
import type { GradingJobPublic } from "@/types/types";
import { displayTimestamp } from "@/utils/dates";
import {
  displayDurationMs,
  getGradingJobMaxScore,
  gradingJobStatusLabels,
} from "@/utils/display";
import type { GradingJobStatusBucket } from "@/utils/grading";
import { gradingJobStatusBucket } from "@/utils/grading";

type BucketFilter = "all" | GradingJobStatusBucket;

// Light/dark hex pairs for the coarse status buckets. Inactive buttons use the
// light fill with dark text; the active button inverts them. "running" borrows
// the app's brand blue so it reads as part of the same system as the active
// status icon (text-blue).
const BUCKET_STYLES: Record<
  BucketFilter,
  { label: string; light: string; dark: string }
> = {
  all: { label: "Total", light: "#E5E7EB", dark: "#202020" },
  queued: { label: "Queued", light: "#E2E8F0", dark: "#475569" },
  running: { label: "Running", light: "#C2E0FB", dark: "#317FD0" },
  completed: { label: "Completed", light: "#DCFCE7", dark: "#15803D" },
  failed: { label: "Failed", light: "#FEE2E2", dark: "#B91C1C" },
};

const BUCKET_ORDER: BucketFilter[] = [
  "all",
  "queued",
  "running",
  "completed",
  "failed",
];

function bucketIconStatus(
  bucket: GradingJobStatusBucket,
): AutograderStatusIconStatus {
  switch (bucket) {
    case "completed":
      return "complete";
    case "failed":
      return "failed";
    case "queued":
      return "pending";
    default:
      return "active";
  }
}

// Resolves a job's responseId to the applicant's name, linked to their
// application. Standalone jobs have no response, so they render a dash.
function ApplicantCell({ responseId }: { responseId: string }) {
  const isStandalone = responseId === STANDALONE_GRADING_RESPONSE_ID;
  const { data: response } = useApplicationResponse(
    isStandalone ? undefined : responseId,
  );
  const {
    data: applicant,
    isPending,
    error,
  } = useApplicantForResponse(isStandalone ? undefined : responseId);

  if (isStandalone) {
    return (
      <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
        Standalone
      </span>
    );
  }

  const name = applicant
    ? `${applicant.firstName} ${applicant.lastName}`
    : isPending
      ? "Loading..."
      : error
        ? "Unable to load applicant"
        : "Unknown applicant";

  if (!response) {
    return <span className="text-muted-foreground">{name}</span>;
  }

  return (
    <Link
      to={`/admin/board/application/${response.applicationFormId}/${responseId}`}
      target="_blank"
      className="font-medium text-blue hover:underline"
    >
      {name}
    </Link>
  );
}

const columnHelper = createColumnHelper<GradingJobPublic>();

const columns = [
  columnHelper.accessor("status", {
    id: "status",
    header: "Status",
    cell: ({ getValue }) => {
      const status = getValue();
      return (
        <span className="flex min-w-44 items-center gap-2">
          <AutograderStatusIcon
            status={bucketIconStatus(gradingJobStatusBucket(status))}
            className="size-4 shrink-0"
          />
          <span>{gradingJobStatusLabels[status]}</span>
        </span>
      );
    },
  }),
  columnHelper.accessor("repoURL", {
    id: "repoURL",
    header: "Repository",
    cell: ({ getValue }) => {
      const repoURL = getValue();
      const repoName = repoURL.split("/").pop() ?? repoURL;
      return (
        <a
          href={`https://github.com/${repoURL}`}
          target="_blank"
          rel="noreferrer"
          className="flex min-w-0 items-center gap-1 font-medium text-blue hover:underline"
          title={repoURL}
        >
          <span className="truncate">{repoName}</span>
          <ExternalLink className="size-3 shrink-0" />
        </a>
      );
    },
  }),
  columnHelper.accessor("responseId", {
    id: "applicant",
    header: "Applicant",
    cell: ({ getValue }) => <ApplicantCell responseId={getValue()} />,
  }),
  columnHelper.accessor((job) => job.score, {
    id: "score",
    header: ({ column }) => (
      <SortableHeader column={column}>Score</SortableHeader>
    ),
    cell: ({ row }) => {
      const job = row.original;
      if (job.status !== GradingJobStatus.Completed) return "—";
      return `${job.score}/${getGradingJobMaxScore(job)}`;
    },
  }),
  columnHelper.accessor((job) => job.started.toMillis(), {
    id: "started",
    header: ({ column }) => (
      <SortableHeader column={column}>Started</SortableHeader>
    ),
    cell: ({ row }) => displayTimestamp(row.original.started),
  }),
  columnHelper.accessor((job) => job.updated.toMillis(), {
    id: "updated",
    header: ({ column }) => (
      <SortableHeader column={column}>Updated</SortableHeader>
    ),
    cell: ({ row }) => displayTimestamp(row.original.updated),
  }),
  columnHelper.accessor(
    (job) => job.updated.toMillis() - job.started.toMillis(),
    {
      id: "duration",
      header: ({ column }) => (
        <SortableHeader column={column}>Duration</SortableHeader>
      ),
      cell: ({ getValue }) => displayDurationMs(getValue()),
    },
  ),
  columnHelper.display({
    id: "actions",
    header: "",
    cell: ({ row }) => (
      <Link
        to={`/autograder/${row.original.id}`}
        target="_blank"
        className="font-medium text-blue hover:underline"
      >
        View run
      </Link>
    ),
  }),
] as ColumnDef<GradingJobPublic>[];

export default function AutograderDashboard() {
  const { data: jobs, isPending, error } = useRecentGradingJobs();
  const [bucketFilter, setBucketFilter] = useState<BucketFilter>("all");
  const [showResponseDialog, setShowResponseDialog] = useState(false);
  const [showStandaloneDialog, setShowStandaloneDialog] = useState(false);

  const countsByBucket = useMemo(() => {
    const counts: Record<GradingJobStatusBucket, number> = {
      queued: 0,
      running: 0,
      completed: 0,
      failed: 0,
    };
    jobs?.forEach((job) => {
      counts[gradingJobStatusBucket(job.status)] += 1;
    });
    return counts;
  }, [jobs]);

  const filteredJobs = useMemo(() => {
    if (!jobs) return [];
    if (bucketFilter === "all") return jobs;
    return jobs.filter(
      (job) => gradingJobStatusBucket(job.status) === bucketFilter,
    );
  }, [jobs, bucketFilter]);

  return (
    <div className="w-full grow px-2 py-4 flex flex-col gap-4 bg-lightgray items-center">
      <div className="max-w-6xl w-full flex flex-col gap-4">
        <div className="flex flex-row flex-wrap items-start gap-4">
          <div className="grow">
            <h1 className="text-2xl font-bold">Autograder Runs</h1>
            <p className="text-muted-foreground">
              Live view of the most recent grading jobs.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              onClick={() => setShowResponseDialog(true)}
            >
              Submit for response
            </Button>
            <Button onClick={() => setShowStandaloneDialog(true)}>
              Submit standalone
            </Button>
          </div>
        </div>

        <div className="bg-white rounded-md p-4 flex flex-col gap-4">
          <div className="overflow-x-scroll flex flex-row gap-2 items-center min-h-28 justify-stretch no-scrollbar">
            {BUCKET_ORDER.map((bucket) => {
              const { label, light, dark } = BUCKET_STYLES[bucket];
              const active = bucketFilter === bucket;
              const count =
                bucket === "all" ? (jobs?.length ?? 0) : countsByBucket[bucket];

              return (
                <Button
                  key={bucket}
                  className="h-28 min-w-40 p-4 flex flex-col items-start"
                  style={{
                    backgroundColor: active ? dark : light,
                    color: active ? light : dark,
                  }}
                  onClick={() => setBucketFilter(bucket)}
                >
                  <span className="text-3xl">{count}</span>
                  <span className="mt-auto">{label}</span>
                </Button>
              );
            })}
          </div>

          {isPending ? (
            <Loading />
          ) : error ? (
            <p className="text-destructive">
              Failed to load grading jobs: {error.message}
            </p>
          ) : (
            <DataTable
              columns={columns}
              data={filteredJobs}
              options={{
                initialState: {
                  sorting: [{ id: "started", desc: true }],
                },
              }}
            />
          )}
        </div>
      </div>

      <SubmitGradingJobDialog
        open={showResponseDialog}
        onOpenChange={setShowResponseDialog}
      />
      <SubmitStandaloneGradingJobDialog
        open={showStandaloneDialog}
        onOpenChange={setShowStandaloneDialog}
      />
    </div>
  );
}
