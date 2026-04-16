import { onSchedule } from "firebase-functions/v2/scheduler";
import { db } from "../index";
import { logger } from "firebase-functions";
import { CollectionReference, Timestamp } from "firebase-admin/firestore";
import { GradingJobPublic, GradingJobStatus } from "../types/grading";

const GRADING_JOBS_PUBLIC_COLLECTION = "grading-jobs-public";
const STALE_TIMEOUT_MINUTES = 30;

export async function cleanupStaleJobs() {
  const cutoffTime = Timestamp.fromMillis(
    Date.now() - STALE_TIMEOUT_MINUTES * 60 * 1000
  );

  const publicGradingJobsCollection = db.collection(GRADING_JOBS_PUBLIC_COLLECTION) as CollectionReference<GradingJobPublic>;

  const staleJobs = await publicGradingJobsCollection
    .where("updated", "<", cutoffTime)
    .where("status", "not-in", [GradingJobStatus.Completed, GradingJobStatus.Failed])
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
      `Marking job ${doc.id} as failed (was in status: ${jobData.status}, last updated: ${jobData.updated.toDate().toISOString()})`
    );
  });

  await batch.commit();
  const cleanedCount = staleJobs.size;

  logger.info(`Successfully cleaned up ${cleanedCount} stale jobs`);

  return { cleanedCount, totalStaleJobs: cleanedCount };
}

export const cleanupStaleJobsOnSchedule = onSchedule(
  "*/10 * * * *",
  async (event) => {
    logger.info("Starting scheduled stale job cleanup...");

    try {
      await cleanupStaleJobs();
    } catch (error) {
      logger.error("Error during stale job cleanup:", error);
    }
  }
);
