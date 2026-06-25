import { FirestoreCollection } from "@app-portal/shared/constants";
import { Timestamp } from "firebase-admin/firestore";
import { logger } from "firebase-functions";
import { onSchedule } from "firebase-functions/v2/scheduler";

import { db } from "../index";
import { GradingJobStatus } from "../types/grading";
import { appCollection } from "../utils/firestore";

const STALE_TIMEOUT_MINUTES = 30;

// this is defined separately from the cronjob
// in case we want to write a route for this logic
async function cleanupStaleJobs() {
  const cutoffTime = Timestamp.fromMillis(
    Date.now() - STALE_TIMEOUT_MINUTES * 60 * 1000,
  );

  const publicGradingJobsCollection = appCollection(
    FirestoreCollection.GradingJobsPublic,
  );

  const staleJobs = await publicGradingJobsCollection
    .where("updated", "<", cutoffTime)
    .where("status", "not-in", [
      GradingJobStatus.Completed,
      GradingJobStatus.Failed,
    ])
    .get();

  if (staleJobs.empty) {
    logger.info("No stale jobs found");
    return { cleanedCount: 0, totalStaleJobs: 0 };
  }

  logger.info(`Found ${staleJobs.size} stale jobs to clean up`);

  const batch = db.batch();

  staleJobs.docs.forEach((doc) => {
    const jobData = doc.data();
    const now = Timestamp.now();

    batch.update(doc.ref, {
      status: GradingJobStatus.Failed,
      error: `Job timed out after ${STALE_TIMEOUT_MINUTES} minutes of inactivity. Last status: ${jobData.status}`,
      updated: now,
      completed: now,
    });

    logger.info(
      `Marking job ${doc.id} as failed (was in status: ${jobData.status}, last updated: ${jobData.updated.toDate().toISOString()})`,
    );
  });

  await batch.commit();
  const cleanedCount = staleJobs.size;

  logger.info(`Successfully cleaned up ${cleanedCount} stale jobs`);

  return { cleanedCount, totalStaleJobs: cleanedCount };
}

export const cleanupStaleJobsOnSchedule = onSchedule(
  "*/10 * * * *",
  async () => {
    logger.info("Starting scheduled stale job cleanup...");

    try {
      await cleanupStaleJobs();
    } catch (error) {
      logger.error("Error during stale job cleanup:", error);
    }
  },
);
