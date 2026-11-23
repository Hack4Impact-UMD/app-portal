import { Timestamp } from "firebase-admin/firestore";
import { logger } from "firebase-functions";
import { onSchedule } from "firebase-functions/v2/scheduler";

import { failStaleJobs } from "../services/gradingJobs";

const STALE_TIMEOUT_MINUTES = 30;

// this is defined separately from the cronjob
// in case we want to write a route for this logic
async function cleanupStaleJobs() {
  const cutoffTime = Timestamp.fromMillis(
    Date.now() - STALE_TIMEOUT_MINUTES * 60 * 1000,
  );

  const failed = await failStaleJobs(cutoffTime, STALE_TIMEOUT_MINUTES);
  if (failed.length === 0) {
    logger.info("No stale jobs found");
    return { cleanedCount: 0, totalStaleJobs: 0 };
  }

  for (const job of failed) {
    logger.info(
      `Marked job ${job.id} as failed (was in status: ${job.status}, last updated: ${job.updated.toDate().toISOString()})`,
    );
  }
  logger.info(`Successfully cleaned up ${failed.length} stale jobs`);

  return { cleanedCount: failed.length, totalStaleJobs: failed.length };
}

export const cleanupStaleJobsOnSchedule = onSchedule(
  { schedule: "*/10 * * * *", region: process.env.GCP_REGION || "us-east4" },
  async () => {
    logger.info("Starting scheduled stale job cleanup...");

    try {
      await cleanupStaleJobs();
    } catch (error) {
      logger.error("Error during stale job cleanup:", error);
    }
  },
);
