import axios, { isAxiosError } from "axios";
import { logger } from "firebase-functions";
import { onSchedule } from "firebase-functions/v2/scheduler";

const GITHUB_API = "https://api.github.com";
const PER_PAGE = 100;

interface RepositoryInvitation {
  id: number;
  repository: { full_name: string };
  inviter: { login: string };
}

function githubHeaders(token: string) {
  return {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  };
}

// Defined separately from the cron wrapper (matching cleanupStaleJobs.ts) so the
// logic could be reused by an HTTP route later.
async function acceptRepositoryInvitations() {
  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    logger.error(
      "GITHUB_TOKEN is not set; skipping GitHub invitation acceptance",
    );
    return { accepted: 0, failed: 0, total: 0 };
  }

  const headers = githubHeaders(token);

  // List all pending invitations, paging through in case there are many.
  const invitations: RepositoryInvitation[] = [];
  for (let page = 1; ; page++) {
    const { data } = await axios.get<RepositoryInvitation[]>(
      `${GITHUB_API}/user/repository_invitations`,
      { headers, params: { per_page: PER_PAGE, page } },
    );
    invitations.push(...data);
    logger.debug(`Fetched invitations page ${page}: ${data.length} item(s)`);
    if (data.length < PER_PAGE) break;
  }

  if (invitations.length === 0) {
    logger.info("No pending repository invitations to accept");
    return { accepted: 0, failed: 0, total: 0 };
  }

  logger.info(`Found ${invitations.length} pending invitation(s)`, {
    repositories: invitations.map((inv) => inv.repository.full_name),
  });

  let accepted = 0;
  let failed = 0;
  for (const inv of invitations) {
    try {
      await axios.patch(
        `${GITHUB_API}/user/repository_invitations/${inv.id}`,
        {},
        { headers },
      );
      accepted++;
      logger.info(`Accepted invitation to ${inv.repository.full_name}`, {
        invitationId: inv.id,
        repository: inv.repository.full_name,
        inviter: inv.inviter?.login,
      });
    } catch (err) {
      failed++;
      const status =
        isAxiosError(err) && err.response ? err.response.status : undefined;
      logger.error(
        `Failed to accept invitation ${inv.id} (${inv.repository.full_name})`,
        { invitationId: inv.id, status, error: err },
      );
    }
  }

  logger.info(
    `Invitation run complete: ${accepted} accepted, ${failed} failed of ${invitations.length}`,
    { accepted, failed, total: invitations.length },
  );
  return { accepted, failed, total: invitations.length };
}

// Cloud Scheduler has a 1-minute minimum interval, so this runs every minute.
// Accepting invitations is idempotent, so repeated runs are safe.
export const acceptGithubInvitationsOnSchedule = onSchedule(
  { schedule: "* * * * *", region: process.env.GCP_REGION || "us-east4" },
  async () => {
    logger.info("Checking for pending GitHub repository invitations...");

    try {
      await acceptRepositoryInvitations();
    } catch (error) {
      const status =
        isAxiosError(error) && error.response
          ? error.response.status
          : undefined;
      logger.error("Error accepting GitHub invitations", { status, error });
    }
  },
);
