import {
  ApplicantRole,
  ApplicationStatus,
  FirestoreCollection,
  PermissionRole,
  QuestionType,
  ReviewStatus,
} from "@app-portal/shared/constants";
import type { InternalApplicationStatus } from "@app-portal/shared/types";
import * as admin from "firebase-admin";
import { Timestamp } from "firebase-admin/firestore";
import { v4 as uuidv4 } from "uuid";

import "../src/index";
import type { ApplicationForm } from "../src/models/appForm";
import type { ApplicationResponse } from "../src/models/appResponse";
import type { Context } from "../src/trpc/context";
import { appRouter } from "../src/trpc/routers";
import { appCollection } from "../src/utils/firestore";

const FIRESTORE_HOST = process.env.FIRESTORE_EMULATOR_HOST;
const AUTH_HOST = process.env.FIREBASE_AUTH_EMULATOR_HOST;
const PROJECT = process.env.GCLOUD_PROJECT;

if (!FIRESTORE_HOST || !AUTH_HOST || !PROJECT) {
  throw new Error(
    "Backend tests must run against the emulators. Use `pnpm test` from the repo root.",
  );
}

const PASSWORD = "Test-Password-123";

export async function resetEmulators() {
  await fetch(
    `http://${FIRESTORE_HOST}/emulator/v1/projects/${PROJECT}/databases/(default)/documents`,
    { method: "DELETE" },
  );
  await fetch(`http://${AUTH_HOST}/emulator/v1/projects/${PROJECT}/accounts`, {
    method: "DELETE",
  });
}

export async function signIn(email: string, password = PASSWORD) {
  const res = await fetch(
    `http://${AUTH_HOST}/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=fake-api-key`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, returnSecureToken: true }),
    },
  );
  const body = (await res.json()) as { idToken?: string };
  if (!body.idToken) throw new Error(`Sign-in failed for ${email}`);
  return body.idToken;
}

type CreateUserOptions = {
  role?: PermissionRole;
  emailVerified?: boolean;
  email?: string;
};

export async function createUser({
  role = PermissionRole.Applicant,
  emailVerified = true,
  email = `user-${uuidv4()}@umd.edu`,
}: CreateUserOptions = {}) {
  const { uid } = await admin
    .auth()
    .createUser({ email, password: PASSWORD, emailVerified });
  await appCollection(FirestoreCollection.Users).doc(uid).set({
    id: uid,
    email,
    firstName: "Test",
    lastName: role,
    role,
    dateCreated: Timestamp.now(),
    activeApplications: [],
    inactiveApplications: [],
    inactive: false,
  });
  return { uid, email, idToken: await signIn(email) };
}

export function caller(idToken?: string, appCheckToken = "test-app-check") {
  const headers: Record<string, string> = {};
  const ctx: Context = {
    req: { headers } as unknown as Context["req"],
    res: { setHeader: () => undefined } as unknown as Context["res"],
    idToken,
    appCheckToken,
  };
  return appRouter.createCaller(ctx);
}

export const ROLE_SECTION = "roles";
export const ROLE_QUESTION = "roles-q";
export const ESSAY_SECTION = "about";
export const ESSAY_QUESTION = "why-h4i";

export async function seedForm(overrides: Partial<ApplicationForm> = {}) {
  const form: ApplicationForm = {
    id: `form-${uuidv4()}`,
    isActive: true,
    semester: "Test Semester",
    description: "Test form",
    dueDate: Timestamp.fromMillis(Date.now() + 7 * 24 * 60 * 60 * 1000),
    decisionsReleased: false,
    scoreWeights: {} as ApplicationForm["scoreWeights"],
    interviewScoreWeights: {} as ApplicationForm["interviewScoreWeights"],
    sections: [
      {
        sectionId: ROLE_SECTION,
        sectionName: "Roles",
        questions: [
          {
            questionId: ROLE_QUESTION,
            questionType: QuestionType.RoleSelect,
            questionText: "Which roles?",
            optional: false,
          },
        ],
      },
      {
        sectionId: ESSAY_SECTION,
        sectionName: "About you",
        questions: [
          {
            questionId: ESSAY_QUESTION,
            questionType: QuestionType.ShortAnswer,
            questionText: "Why Hack4Impact?",
            optional: false,
            maximumWordCount: 20,
          },
        ],
      },
    ],
    ...overrides,
  };
  await appCollection(FirestoreCollection.ApplicationForms)
    .doc(form.id)
    .set(form);
  return form;
}

export function sectionResponses(
  formId: string,
  {
    roles = [ApplicantRole.Engineer],
    essay = "I want to help nonprofits.",
  } = {},
) {
  return [
    {
      sectionId: ROLE_SECTION,
      sectionName: "Roles",
      questions: [
        {
          questionId: ROLE_QUESTION,
          questionType: QuestionType.RoleSelect,
          applicationFormId: formId,
          response: roles,
        },
      ],
    },
    {
      sectionId: ESSAY_SECTION,
      sectionName: "About you",
      questions: [
        {
          questionId: ESSAY_QUESTION,
          questionType: QuestionType.ShortAnswer,
          applicationFormId: formId,
          response: essay,
        },
      ],
    },
  ];
}

export async function seedResponse(
  userId: string,
  formId: string,
  overrides: Partial<ApplicationResponse> = {},
) {
  const response: ApplicationResponse = {
    id: uuidv4(),
    userId,
    applicationFormId: formId,
    rolesApplied: [ApplicantRole.Engineer],
    sectionResponses: sectionResponses(formId),
    status: ApplicationStatus.InProgress,
    dateSubmitted: Timestamp.now(),
    ...overrides,
  };
  await appCollection(FirestoreCollection.ApplicationResponses)
    .doc(response.id)
    .set(response);
  return response;
}

export async function seedStatus(
  responseId: string,
  formId: string,
  status: ReviewStatus,
  role = ApplicantRole.Engineer,
) {
  const doc: InternalApplicationStatus = {
    id: uuidv4(),
    formId,
    responseId,
    role,
    status,
    isQualified: status !== ReviewStatus.UnderReview,
  };
  await appCollection(FirestoreCollection.ApplicationStatus)
    .doc(doc.id)
    .set(doc);
  return doc;
}

export async function getDoc<C extends FirestoreCollection>(
  collection: C,
  id: string,
) {
  return (await appCollection(collection).doc(id).get()).data();
}

export async function expectTRPCError(
  promise: Promise<unknown>,
  code: string,
  message?: string | RegExp,
) {
  const error = await promise.then(
    () => undefined,
    (e: unknown) => e as { code?: string; message?: string; cause?: unknown },
  );
  if (!error)
    throw new Error(`Expected a ${code} error, but the call succeeded`);
  if (error.code !== code) {
    throw new Error(`Expected ${code}, got ${error.code}: ${error.message}`);
  }
  if (message !== undefined) {
    const ok =
      typeof message === "string"
        ? error.message === message
        : message.test(error.message ?? "");
    if (!ok) throw new Error(`Unexpected error message: ${error.message}`);
  }
  return error;
}
