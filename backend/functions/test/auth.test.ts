import {
  ApplicantRole,
  ApplicationStatus,
  FirestoreCollection,
  PermissionRole,
  ReviewStatus,
} from "@app-portal/shared/constants";
import * as admin from "firebase-admin";
import { beforeEach, describe, expect, it } from "vitest";

import { appCollection } from "../src/utils/firestore";
import {
  caller,
  createUser,
  ESSAY_SECTION,
  expectTRPCError,
  getDoc,
  resetEmulators,
  ROLE_SECTION,
  seedForm,
  signIn,
} from "./helpers";

beforeEach(resetEmulators);

describe("auth.register", () => {
  const form = {
    email: "new.applicant@umd.edu",
    password: "Strong-Password-1",
    firstName: "New",
    lastName: "Applicant",
  };

  it("creates an unverified auth user and an applicant profile", async () => {
    const user = await caller().auth.register(form);

    expect(user).toMatchObject({
      email: form.email,
      firstName: "New",
      lastName: "Applicant",
      role: PermissionRole.Applicant,
      inactive: false,
    });

    const authUser = await admin.auth().getUser(user.id);
    expect(authUser.email).toBe(form.email);
    expect(authUser.emailVerified).toBe(false);
    expect(authUser.displayName).toBe("New Applicant");

    const profile = await getDoc(FirestoreCollection.Users, user.id);
    expect(profile?.role).toBe(PermissionRole.Applicant);
  });

  it("only allows umd.edu and hack4impact.org emails", async () => {
    await expectTRPCError(
      caller().auth.register({ ...form, email: "someone@gmail.com" }),
      "BAD_REQUEST",
      "Only emails ending in umd.edu or hack4impact.org are allowed!",
    );
  });

  it("rejects an email that's already registered", async () => {
    await caller().auth.register(form);
    await expectTRPCError(caller().auth.register(form), "BAD_REQUEST");
  });

  it("validates the input", async () => {
    await expectTRPCError(
      caller().auth.register({ ...form, firstName: "" }),
      "BAD_REQUEST",
    );
  });
});

describe("auth.update", () => {
  it("updates the profile and the auth user", async () => {
    const { uid, idToken } = await createUser();

    const updated = await caller(idToken).auth.update({
      email: "renamed@umd.edu",
      firstName: "Renamed",
      lastName: "Person",
    });

    expect(updated).toMatchObject({
      email: "renamed@umd.edu",
      firstName: "Renamed",
      lastName: "Person",
    });
    const authUser = await admin.auth().getUser(uid);
    expect(authUser.email).toBe("renamed@umd.edu");
    expect(authUser.displayName).toBe("Renamed Person");
  });

  it("requires a signed-in user", async () => {
    await expectTRPCError(
      caller().auth.update({
        email: "x@umd.edu",
        firstName: "X",
        lastName: "Y",
      }),
      "UNAUTHORIZED",
    );
  });

  it("rejects users who haven't verified their email", async () => {
    const { idToken } = await createUser({ emailVerified: false });
    await expectTRPCError(
      caller(idToken).auth.update({
        email: "x@umd.edu",
        firstName: "X",
        lastName: "Y",
      }),
      "FORBIDDEN",
      "Email not verified!",
    );
  });

  it("rejects an invalid ID token", async () => {
    await expectTRPCError(
      caller("not-a-real-token").auth.update({
        email: "x@umd.edu",
        firstName: "X",
        lastName: "Y",
      }),
      "UNAUTHORIZED",
    );
  });
});

describe("auth.createInternalApplicant", () => {
  it("creates a qualified internal applicant for a super reviewer", async () => {
    const form = await seedForm();
    const { idToken } = await createUser({
      role: PermissionRole.SuperReviewer,
    });

    const { user, applicationResponse } = await caller(
      idToken,
    ).auth.createInternalApplicant({
      firstName: "Internal",
      lastName: "Member",
      formId: form.id,
      rolesApplied: [ApplicantRole.Engineer, ApplicantRole.Designer],
      sectionResponses: [
        { sectionId: ROLE_SECTION, sectionName: "Roles", questions: [] },
        { sectionId: ESSAY_SECTION, sectionName: "About you", questions: [] },
      ],
    });

    expect(user).toMatchObject({
      role: PermissionRole.Applicant,
      isInternal: true,
      activeApplications: [form.id],
    });
    expect(applicationResponse.status).toBe(ApplicationStatus.Submitted);

    const statuses = (
      await appCollection(FirestoreCollection.ApplicationStatus)
        .where("responseId", "==", applicationResponse.id)
        .get()
    ).docs.map((d) => d.data());
    expect(statuses.map((s) => s.role).sort()).toEqual([
      ApplicantRole.Designer,
      ApplicantRole.Engineer,
    ]);
    expect(
      statuses.every(
        (s) => s.status === ReviewStatus.Interview && s.isQualified,
      ),
    ).toBe(true);
  });

  it("is limited to super reviewers", async () => {
    const form = await seedForm();
    const { idToken } = await createUser({ role: PermissionRole.Reviewer });

    await expectTRPCError(
      caller(idToken).auth.createInternalApplicant({
        firstName: "Internal",
        lastName: "Member",
        formId: form.id,
        rolesApplied: [ApplicantRole.Engineer],
        sectionResponses: [
          { sectionId: ROLE_SECTION, sectionName: "Roles", questions: [] },
        ],
      }),
      "FORBIDDEN",
    );
  });
});

describe("App Check", () => {
  const withEnv = async (
    env: Record<string, string | undefined>,
    fn: () => Promise<void>,
  ) => {
    const previous = Object.fromEntries(
      Object.keys(env).map((k) => [k, process.env[k]]),
    );
    Object.assign(process.env, env);
    for (const [k, v] of Object.entries(env))
      if (v === undefined) delete process.env[k];
    try {
      await fn();
    } finally {
      for (const [k, v] of Object.entries(previous)) {
        if (v === undefined) delete process.env[k];
        else process.env[k] = v;
      }
    }
  };

  it("rejects requests without a token when the bypass is off", async () => {
    const { email } = await createUser();
    const idToken = await signIn(email);
    await withEnv({ APPCHECK_EMULATOR_BYPASS: undefined }, async () => {
      await expectTRPCError(
        caller(idToken, "").auth.update({
          email,
          firstName: "A",
          lastName: "B",
        }),
        "FORBIDDEN",
      );
    });
  });

  it("only bypasses inside the functions emulator", async () => {
    const { email, idToken } = await createUser();
    await withEnv({ FUNCTIONS_EMULATOR: undefined }, async () => {
      await expectTRPCError(
        caller(idToken, "").auth.update({
          email,
          firstName: "A",
          lastName: "B",
        }),
        "FORBIDDEN",
      );
    });
  });
});
