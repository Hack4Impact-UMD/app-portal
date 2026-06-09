import axios from "axios";

const GITHUB_API_URL = "https://api.github.com";
const REPO_OWNER = "Hack4Impact-UMD";
const REPO_NAME = "h4i-internal-application-tool";

interface BranchInfo {
  commit: {
    sha: string;
  };
}

interface CheckRun {
  status: "queued" | "in_progress" | "completed";
  conclusion:
    | "success"
    | "failure"
    | "neutral"
    | "cancelled"
    | "timed_out"
    | "action_required"
    | "stale"
    | null;
}

interface CheckRunsResponse {
  total_count: number;
  check_runs: CheckRun[];
}

export async function getLatestDeployedCommit(): Promise<string | null> {
  try {
    const branchRes = await axios.get<BranchInfo>(
      `${GITHUB_API_URL}/repos/${REPO_OWNER}/${REPO_NAME}/branches/main`,
    );
    const latestCommitSha = branchRes.data.commit.sha;

    const checkRunsRes = await axios.get<CheckRunsResponse>(
      `${GITHUB_API_URL}/repos/${REPO_OWNER}/${REPO_NAME}/commits/${latestCommitSha}/check-runs`,
    );
    const { total_count, check_runs } = checkRunsRes.data;

    if (total_count === 0) {
      console.log(
        `No check runs found for commit ${latestCommitSha}. Not ready for update.`,
      );
      return null;
    }

    const allChecksSuccessful = check_runs.every(
      (run) => run.status === "completed" && run.conclusion === "success",
    );

    if (allChecksSuccessful) {
      return latestCommitSha;
    } else {
      console.log(
        `Latest commit ${latestCommitSha} has incomplete or failed check runs. Not ready for update.`,
      );
      return null;
    }
  } catch (error) {
    console.error("Error fetching latest commit from GitHub:", error);
    return null;
  }
}

export async function getUpdateCheck(localCommit: string) {
  if (!localCommit || localCommit === "dev") {
    console.warn("Skipping update check (dev environment)");
    return false;
  }

  const remoteCommit = await getLatestDeployedCommit();

  if (remoteCommit && remoteCommit !== localCommit) {
    console.log(
      `New version available. Local: ${localCommit}, Remote: ${remoteCommit}`,
    );
    return true;
  }

  return false;
}
