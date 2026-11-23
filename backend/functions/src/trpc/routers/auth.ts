import {
  ApplicationStatus,
  FirestoreCollection,
  ReviewStatus,
  PermissionRole,
} from "@app-portal/shared/constants";
import type { InternalApplicationStatus } from "@app-portal/shared/types";
import {
  createInternalApplicantSchema,
  updateUserSchema,
  userRegisterFormSchema,
} from "@app-portal/shared/types";
import { TRPCError } from "@trpc/server";
import * as admin from "firebase-admin";
import { FirebaseAuthError } from "firebase-admin/auth";
import { Timestamp } from "firebase-admin/firestore";
import { logger } from "firebase-functions";
import { v4 as uuidv4 } from "uuid";

import { db } from "../../index";
import type { ApplicationResponse } from "../../models/appResponse";
import type { UserProfile } from "../../models/user";
import { appCollection } from "../../utils/firestore";
import {
  authedProcedure,
  publicProcedure,
  roleProcedure,
  router,
} from "../init";

function authErrorToTRPC(error: unknown): TRPCError {
  if (error instanceof TRPCError) return error;
  if (error instanceof FirebaseAuthError) {
    return new TRPCError({
      code: "BAD_REQUEST",
      message: error.message,
      cause: error,
    });
  }
  return new TRPCError({ code: "INTERNAL_SERVER_ERROR", cause: error });
}

// umd.edu and its subdomains (e.g. terpmail.umd.edu), or exactly hack4impact.org.
const ALLOWED_EMAIL = /^[^@\s]+@(([^@\s.]+\.)*umd\.edu|hack4impact\.org)$/i;

function assertAllowedEmail(email: string) {
  if (!ALLOWED_EMAIL.test(email.trim())) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Only emails ending in umd.edu or hack4impact.org are allowed!",
    });
  }
}

export const authRouter = router({
  register: publicProcedure
    .input(userRegisterFormSchema)
    .mutation(async ({ input: registerForm }) => {
      assertAllowedEmail(registerForm.email);

      try {
        const userRecord = await admin.auth().createUser({
          email: registerForm.email,
          password: registerForm.password,
          displayName: `${registerForm.firstName} ${registerForm.lastName}`,
          disabled: false,
          emailVerified: false,
        });

        logger.info(`Auth user created with UID ${userRecord.uid}`);

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

        await appCollection(FirestoreCollection.Users)
          .doc(userRecord.uid)
          .create(user);

        logger.info(
          `Successfully created user doc for ${user.firstName} ${user.lastName} (${user.email}) with ID: ${user.id}`,
        );

        return user;
      } catch (error) {
        throw authErrorToTRPC(error);
      }
    }),

  update: authedProcedure
    .input(updateUserSchema)
    .mutation(async ({ input: updateForm, ctx }) => {
      const uid = ctx.token.uid;

      try {
        // Email changes go through verifyBeforeUpdateEmail on the client, which
        // only changes the auth email once the new address is verified. This
        // endpoint just syncs the profile doc to that verified email, so it
        // never changes the auth email itself.
        const authUser = await admin.auth().getUser(uid);
        if (updateForm.email !== authUser.email) {
          logger.warn(`User ${uid} tried to set an unverified email`);
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Verify your new email address before updating it.",
          });
        }
        assertAllowedEmail(updateForm.email);

        const updatedUserRecord = await admin.auth().updateUser(uid, {
          displayName: `${updateForm.firstName} ${updateForm.lastName}`,
        });

        logger.info(
          `Successfully updated auth user for UID: ${updatedUserRecord.uid}`,
        );

        // will throw if doc doesn't exist
        const userRef = appCollection(FirestoreCollection.Users).doc(uid);
        await userRef.update({
          email: updateForm.email,
          firstName: updateForm.firstName,
          lastName: updateForm.lastName,
        });

        logger.info(`Successfully updated user doc for UID: ${uid}`);

        // fetch updated user to return, necessary to update app state immediately
        const finalUser = (await userRef.get()).data();

        if (!finalUser) {
          logger.error(`User doc undefined after update for UID: ${uid}`);
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "User profile could not be retrieved after update.",
          });
        }

        return finalUser;
      } catch (error) {
        throw authErrorToTRPC(error);
      }
    }),

  createInternalApplicant: roleProcedure([PermissionRole.SuperReviewer])
    .input(createInternalApplicantSchema)
    .mutation(async ({ input: requestData }) => {
      const formSnap = await appCollection(FirestoreCollection.ApplicationForms)
        .doc(requestData.formId)
        .get();

      if (!formSnap.exists || !formSnap.data()) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Application form with ID ${requestData.formId} could not be retrieved`,
        });
      }

      // note: internal applicants are only given a user doc, not auth.
      // any other code where doc/auth are manipulated together must be updated.
      const usersCollection = appCollection(FirestoreCollection.Users);
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
        appCollection(FirestoreCollection.ApplicationResponses).doc(
          applicationResponseId,
        ),
        newApplicationResponse,
      );

      const statusCollection = appCollection(
        FirestoreCollection.ApplicationStatus,
      );

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

      return { user: newUser, applicationResponse: newApplicationResponse };
    }),
});
