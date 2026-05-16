import { Router, Request, Response } from "express";
import { db } from "../index";
import { validateSchema } from "../middleware/validation";
import {
  UserProfile,
  UserRegisterForm,
  userRegisterFormSchema,
  updateUserSchema,
  CreateInternalApplicant,
  createInternalApplicantSchema,
  PermissionRole,
  UpdateUser,
} from "../models/user";
import {
  CollectionReference,
  DocumentReference,
  Timestamp,
} from "firebase-admin/firestore";
import { logger } from "firebase-functions";
import * as admin from "firebase-admin";
import { isAuthenticated } from "../middleware/authentication";
import { FirebaseAuthError } from "firebase-admin/auth";
import { ApplicationResponse, ApplicationStatus } from "../models/appResponse";
import { InternalApplicationStatus, ReviewStatus } from "../models/appStatus";
import { ApplicationForm } from "../models/appForm";
import { v4 as uuidv4 } from "uuid";

/* eslint new-cap: 0 */
const router = Router();

router.post(
  "/register",
  [validateSchema(userRegisterFormSchema)],
  async (req: Request, res: Response) => {
    const registerForm = req.body as UserRegisterForm;

    try {
      if (
        !registerForm.email.trim().endsWith("umd.edu") &&
        !registerForm.email.trim().endsWith("@hack4impact.org")
      ) {
        res
          .status(400)
          .send(
            "Only emails ending in umd.edu or hack4impact.org are allowed!",
          );
        return;
      }

      const userRecord = await admin.auth().createUser({
        email: registerForm.email,
        password: registerForm.password,
        displayName: `${registerForm.firstName} ${registerForm.lastName}`,
        disabled: false,
        emailVerified: false,
      });

      logger.info(`Auth user created with UID ${userRecord.uid}`);

      const collection = db.collection(
        "users",
      ) as CollectionReference<UserProfile>;

      const user: UserProfile = {
        id: userRecord.uid,
        email: registerForm.email,
        firstName: registerForm.firstName,
        lastName: registerForm.lastName,
        role: PermissionRole.Applicant, // by default, everyone is set to applicant. higher privelages can only be assigned by super-reviewers
        dateCreated: Timestamp.now(),
        activeApplications: [],
        inactiveApplications: [],
        inactive: false, // active by default
      };

      await collection.doc(userRecord.uid).create(user);

      logger.info(
        `Successfully created user doc for ${user.firstName} ${user.lastName} (${user.email}) with ID: ${user.id}`,
      );

      res.status(200).send(user);
    } catch (error) {
      if (error instanceof FirebaseAuthError) {
        res.status(500).send(error.message);
      } else {
        res.status(500).send();
      }
    }
  },
);

router.post(
  "/update",
  [isAuthenticated, validateSchema(updateUserSchema)],
  async (req: Request, res: Response) => {
    const updateForm = req.body as UpdateUser;
    const uid = req.token!.uid;

    try {
      const updatedUserRecord = await admin.auth().updateUser(uid, {
        email: updateForm.email,
        displayName: `${updateForm.firstName} ${updateForm.lastName}`,
      });

      logger.info(
        `Successfully updated auth user for UID: ${updatedUserRecord.uid}`,
      );

      // will throw if doc doesn't exist
      const userRef = db
        .collection("users")
        .doc(uid) as DocumentReference<UserProfile>;
      await userRef.update({
        email: updateForm.email,
        firstName: updateForm.firstName,
        lastName: updateForm.lastName,
      });

      logger.info(
        `Successfully updated user doc for UID: ${updatedUserRecord.uid}`,
      );

      // fetch updated user to return, necessary to update app state immediately
      const finalSnap = await userRef.get();
      const finalUser = finalSnap.data();

      if (!finalUser) {
        logger.error(`User doc undefined after update for UID: ${uid}`);
        return res
          .status(500)
          .send("User profile could not be retrieved after update.");
      }

      return res.status(200).json(finalUser);
    } catch (error) {
      if (error instanceof FirebaseAuthError) {
        return res.status(500).send(error.message);
      } else {
        return res.status(500).send();
      }
    }
  },
);

router.post(
  "/create-internal-applicant",
  [isAuthenticated, validateSchema(createInternalApplicantSchema)],
  async (req: Request, res: Response) => {
    const requestData = req.body as CreateInternalApplicant;
    const requestorUid = req.token!.uid;

    try {
      const requestorRef = db
        .collection("users")
        .doc(requestorUid) as DocumentReference<UserProfile>;
      const requestorSnap = await requestorRef.get();
      const requestor = requestorSnap.data();

      if (!requestor || requestor.role !== PermissionRole.SuperReviewer) {
        return res
          .status(403)
          .send("Only super-reviewers can create internal applicants");
      }

      const formRef = db
        .collection("application-forms")
        .doc(requestData.formId) as DocumentReference<ApplicationForm>;
      const formSnap = await formRef.get();

      if (!formSnap.exists || !formSnap.data()) {
        return res
          .status(400)
          .send(
            `Application form with ID ${requestData.formId} could not be retrieved`,
          );
      }

      // note: internal applicants are only given a user doc, not auth.
      // any other code where doc/auth are manipulated together must be updated.
      const usersCollection = db.collection(
        "users",
      ) as CollectionReference<UserProfile>;
      const userId = uuidv4();

      const batch = db.batch();

      const newUser: UserProfile = {
        id: userId,
        email: `dummy${uuidv4()}@uva.edu`,
        firstName: requestData.firstName,
        lastName: requestData.lastName,
        role: PermissionRole.Applicant,
        isInternal: true,
        dateCreated: Timestamp.now(),
        activeApplications: [requestData.formId],
        inactiveApplications: [],
        inactive: false,
      };

      batch.set(usersCollection.doc(userId), newUser);

      logger.info(
        `created internal applicant ${newUser.firstName} ${newUser.lastName} with ID: ${newUser.id}`,
      );

      const applicationResponsesCollection = db.collection(
        "application-responses",
      ) as CollectionReference<ApplicationResponse>;
      const applicationResponseId = uuidv4();

      // internal applicants skip the review process
      // immediately qualified for interview via response + status
      const newApplicationResponse: ApplicationResponse = {
        id: applicationResponseId,
        userId: userId,
        applicationFormId: requestData.formId,
        rolesApplied: requestData.rolesApplied,
        sectionResponses: requestData.sectionResponses,
        status: ApplicationStatus.Submitted,
        dateSubmitted: Timestamp.now(),
      };

      batch.set(
        applicationResponsesCollection.doc(applicationResponseId),
        newApplicationResponse,
      );

      const statusCollection = db.collection(
        "app-status",
      ) as CollectionReference<InternalApplicationStatus>;

      for (const role of requestData.rolesApplied) {
        const statusId = uuidv4();
        const newStatus: InternalApplicationStatus = {
          id: statusId,
          formId: requestData.formId,
          role: role,
          responseId: applicationResponseId,
          status: ReviewStatus.Interview,
          isQualified: true,
        };

        batch.set(statusCollection.doc(statusId), newStatus);
      }

      await batch.commit();
      logger.info(
        `submitted response and qualified status documents for internal applicant ${userId}`,
      );

      return res.status(200).json({
        user: newUser,
        applicationResponse: newApplicationResponse,
      });
    } catch (error) {
      logger.error("Error creating internal applicant:", error);
      if (error instanceof Error) {
        return res.status(500).send(error.message);
      } else {
        return res.status(500).send("Internal server error");
      }
    }
  },
);

export default router;
