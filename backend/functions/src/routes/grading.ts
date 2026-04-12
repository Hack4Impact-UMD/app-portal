import { Router, Response, Request } from "express";
import { db } from "../index";
import { isAuthenticated, hasRoles, getUserById } from "../middleware/authentication";
import { validateSchema } from "../middleware/validation";
import { v4 as uuidv4 } from "uuid";
import { CollectionReference, Timestamp } from "firebase-admin/firestore";
import { logger } from "firebase-functions";
import { publishGradingTask } from "../utils/cloudTasks";
import { PermissionRole } from "../models/appReview";
import { submitGradingJobSchema, GradingJobStatus, GradingJobPublic, GradingJobDataInternal } from "../types/grading";
import { ApplicationResponse } from "../models/appResponse";

const router = Router();

// TODO: we should have a centralized file for importing these to avoid duplication
const GRADING_JOBS_PUBLIC_COLLECTION = "grading-jobs-public";
const GRADING_JOBS_INTERNAL_COLLECTION = "grading-jobs-internal";
const APPLICATION_RESPONSES_COLLECTION = "application-responses";

router.post(
  "/submit",
  [
    isAuthenticated,
    hasRoles([
      PermissionRole.Applicant,
      PermissionRole.Board,
      PermissionRole.SuperReviewer,
    ]),
    validateSchema(submitGradingJobSchema),
  ],
  async (req: Request, res: Response) => {
    try {
      const { responseId, repoURL } = req.body;
      const userId = req.token?.uid;
      const user = await getUserById(userId ?? "")

      if (!userId || !user) {
        return res.status(401).send("Unauthorized");
      }

      logger.info(`Received autograder request for responseId ${responseId}`);

      const applicationResponseCollection = db.collection(APPLICATION_RESPONSES_COLLECTION) as CollectionReference<ApplicationResponse>;
      const gradingJobsPublicCollection = db.collection(GRADING_JOBS_PUBLIC_COLLECTION) as CollectionReference<GradingJobPublic>;
      const gradingJobsInternalCollection = db.collection(GRADING_JOBS_INTERNAL_COLLECTION) as CollectionReference<GradingJobDataInternal>;

      const responseDoc = await applicationResponseCollection.doc(responseId).get();

      if (!responseDoc.exists) {
        logger.warn(`Response ${responseId} not found`);
        return res.status(404).send("Application response not found");
      }

      const responseData = responseDoc.data() as ApplicationResponse;

      const isOwner = responseData?.userId === userId;
      const isAdmin = ["board", "super-reviewer"].includes(user.role);

      if (!isOwner && !isAdmin) {
        logger.warn(`User ${userId} attempted to submit grading for response ${responseId} they don't own`);
        return res.status(403).send("You do not have permission to submit an autograder request for this application");
      }

      const jobId = uuidv4();
      const now = Timestamp.now();
      const testRepo = "https://github.com/Hack4Impact-UMD/FAKE_REPO"; // TODO: replace with real repo

      // NOTE: cloud tasks publishing is outside this transaction right now, so docs may be created and left even if publish fails
      const duplicateFound = await db.runTransaction(async (transaction) => {
        // validation: exit if user has existing running job
        const existingJobsSnapshot = await transaction.get(
          gradingJobsPublicCollection.where("responseId", "==", responseId)
        );

        const runningJobs = existingJobsSnapshot.docs.filter(doc => {
          const status = doc.data().status;
          return status !== GradingJobStatus.Completed && status !== GradingJobStatus.Failed;
        });

        if (runningJobs.length > 0) {
          return true; 
        }

        // create: job docs and cloud tasks job
        const publicJob = {
          id: jobId,
          responseId,
          repoURL,
          status: GradingJobStatus.Queued,
          score: 0,
          totalTests: 0, // TODO: fetch to real repo's # of tests
          completedTests: 0,
          started: now,
          updated: now,
          publicTests: {},
        };

        const internalJob = {
          id: jobId,
          testRepo,
          buildLog: "",
          installLog: "",
          playwrightLog: "",
          tests: {},
        };

        transaction.set(gradingJobsPublicCollection.doc(jobId), publicJob);
        transaction.set(gradingJobsInternalCollection.doc(jobId), internalJob);

        return false; 
      });

      if (duplicateFound) {
        logger.info(`Found existing running job for response ${responseId}`);
        return res.status(409).send("A grading job is already in progress for this application.");
      }

      logger.info(`Created Firestore documents for job ${jobId}`);

      const taskName = await publishGradingTask({
        jobId,
        responseId,
        repoURL,
        testRepo,
      });

      logger.info(`Successfully published task ${taskName} for job ${jobId}`);

      return res.status(200).json({
        status: "success",
        message: "Grading job queued successfully",
        jobId,
      });

    } catch (error) {
      logger.error("Failed to submit grading job:", error);
      return res.status(500).send("Failed to submit grading job");
    }
  }
);

export default router;
