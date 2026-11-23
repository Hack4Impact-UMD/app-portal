import { randomUUID } from "node:crypto";

import {
  ApplicantRole,
  ApplicationStatus,
  FirestoreCollection,
  PermissionRole,
  QuestionType,
  ReviewStatus,
} from "@app-portal/shared/constants";
import { getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore, Timestamp } from "firebase-admin/firestore";

const PROJECT = "h4i-applications";
const FIRESTORE_HOST = process.env.FIRESTORE_EMULATOR_HOST;
const AUTH_HOST = process.env.FIREBASE_AUTH_EMULATOR_HOST;

for (const host of [FIRESTORE_HOST, AUTH_HOST]) {
  if (!host || !/^(127\.0\.0\.1|localhost|\[::1\]|::1):\d+$/.test(host)) {
    throw new Error(
      "E2E tests must run against local emulators. Use `pnpm test:e2e` from the repo root.",
    );
  }
}

const app = getApps()[0] ?? initializeApp({ projectId: PROJECT });
const db = getFirestore(app);
const auth = getAuth(app);

export const PASSWORD = "E2ePassword#1";
export const FORM_ID = "e2e-form";
export const ESSAY_PROMPT = "Why do you want to join Hack4Impact?";

export async function resetEmulators() {
  await fetch(
    `http://${FIRESTORE_HOST}/emulator/v1/projects/${PROJECT}/databases/(default)/documents`,
    { method: "DELETE" },
  );
  await fetch(`http://${AUTH_HOST}/emulator/v1/projects/${PROJECT}/accounts`, {
    method: "DELETE",
  });
}

export function uniqueEmail(prefix: string) {
  return `${prefix}-${randomUUID().slice(0, 8)}@umd.edu`;
}

export async function createApplicant(firstName = "Erin") {
  const email = uniqueEmail(firstName.toLowerCase());
  const { uid } = await auth.createUser({
    email,
    password: PASSWORD,
    emailVerified: true,
  });
  await db.collection(FirestoreCollection.Users).doc(uid).set({
    id: uid,
    email,
    firstName,
    lastName: "Tester",
    role: PermissionRole.Applicant,
    dateCreated: Timestamp.now(),
    activeApplications: [],
    inactiveApplications: [],
    inactive: false,
  });
  return { uid, email, firstName };
}

export async function seedActiveForm({ decisionsReleased = false } = {}) {
  const form = {
    id: FORM_ID,
    isActive: true,
    semester: "E2E Semester",
    description: "An application form used by the end-to-end tests.",
    dueDate: Timestamp.fromMillis(Date.now() + 7 * 24 * 60 * 60 * 1000),
    decisionsReleased,
    scoreWeights: {},
    interviewScoreWeights: {},
    sections: [
      {
        sectionId: "roles",
        sectionName: "Roles",
        questions: [
          {
            questionId: "roles-q",
            questionType: QuestionType.RoleSelect,
            questionText: "Which roles?",
            optional: false,
          },
        ],
      },
      {
        sectionId: "about",
        sectionName: "About you",
        questions: [
          {
            questionId: "why-h4i",
            questionType: QuestionType.ShortAnswer,
            questionText: ESSAY_PROMPT,
            optional: false,
          },
        ],
      },
    ],
  };
  await db
    .collection(FirestoreCollection.ApplicationForms)
    .doc(FORM_ID)
    .set(form);
  return form;
}

export async function setDecisionsReleased(released: boolean) {
  await db
    .collection(FirestoreCollection.ApplicationForms)
    .doc(FORM_ID)
    .update({ decisionsReleased: released });
}

export async function seedSubmittedApplication(
  userId: string,
  status: ReviewStatus,
) {
  const responseId = randomUUID();
  await db
    .collection(FirestoreCollection.ApplicationResponses)
    .doc(responseId)
    .set({
      id: responseId,
      userId,
      applicationFormId: FORM_ID,
      rolesApplied: [ApplicantRole.Engineer],
      status: ApplicationStatus.Submitted,
      dateSubmitted: Timestamp.now(),
      sectionResponses: [
        {
          sectionId: "roles",
          sectionName: "Roles",
          questions: [
            {
              questionId: "roles-q",
              questionType: QuestionType.RoleSelect,
              applicationFormId: FORM_ID,
              response: [ApplicantRole.Engineer],
            },
          ],
        },
        {
          sectionId: "about",
          sectionName: "About you",
          questions: [
            {
              questionId: "why-h4i",
              questionType: QuestionType.ShortAnswer,
              applicationFormId: FORM_ID,
              response: "To build software for nonprofits.",
            },
          ],
        },
      ],
    });
  await db
    .collection(FirestoreCollection.Users)
    .doc(userId)
    .update({ activeApplications: [FORM_ID] });

  const statusId = randomUUID();
  await db
    .collection(FirestoreCollection.ApplicationStatus)
    .doc(statusId)
    .set({
      id: statusId,
      formId: FORM_ID,
      responseId,
      role: ApplicantRole.Engineer,
      status,
      isQualified: status !== ReviewStatus.UnderReview,
    });
  return { responseId, statusId };
}

export async function getResponsesFor(userId: string) {
  return (
    await db
      .collection(FirestoreCollection.ApplicationResponses)
      .where("userId", "==", userId)
      .get()
  ).docs.map((d) => d.data());
}

export async function getStatusesFor(responseId: string) {
  return (
    await db
      .collection(FirestoreCollection.ApplicationStatus)
      .where("responseId", "==", responseId)
      .get()
  ).docs.map((d) => d.data());
}

export async function getUserByEmail(email: string) {
  const snap = await db
    .collection(FirestoreCollection.Users)
    .where("email", "==", email)
    .get();
  return snap.docs[0]?.data();
}

export async function getVerificationLink(email: string) {
  const res = await fetch(
    `http://${AUTH_HOST}/emulator/v1/projects/${PROJECT}/oobCodes`,
  );
  const { oobCodes } = (await res.json()) as {
    oobCodes: { email: string; requestType: string; oobLink: string }[];
  };
  const code = oobCodes
    .filter((c) => c.email === email && c.requestType === "VERIFY_EMAIL")
    .at(-1);
  if (!code) throw new Error(`No verification email sent to ${email}`);
  return code.oobLink;
}
