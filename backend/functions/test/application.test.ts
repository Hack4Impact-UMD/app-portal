import {
  ApplicantRole,
  ApplicationStatus,
  FirestoreCollection,
  PermissionRole,
  ReviewStatus,
} from "@app-portal/shared/constants";
import { Timestamp } from "firebase-admin/firestore";
import { beforeEach, describe, expect, it } from "vitest";

import { SubmitValidationError } from "../src/trpc/errors";
import { appCollection } from "../src/utils/firestore";
import {
  caller,
  createUser,
  ESSAY_QUESTION,
  ESSAY_SECTION,
  expectTRPCError,
  getDoc,
  resetEmulators,
  ROLE_QUESTION,
  ROLE_SECTION,
  sectionResponses,
  seedForm,
  seedResponse,
} from "./helpers";

beforeEach(resetEmulators);

function saveRequest(
  response: { id: string; applicationFormId: string },
  options?: Parameters<typeof sectionResponses>[1],
) {
  const roles = options?.roles ?? [ApplicantRole.Engineer];
  return {
    id: response.id,
    applicationFormId: response.applicationFormId,
    rolesApplied: roles,
    sectionResponses: sectionResponses(response.applicationFormId, options),
  };
}

function submitRequest(
  response: { id: string; userId: string; applicationFormId: string },
  options?: Parameters<typeof sectionResponses>[1],
) {
  return {
    ...saveRequest(response, options),
    userId: response.userId,
    status: ApplicationStatus.InProgress,
  } as const;
}

describe("application.save", () => {
  it("saves and later edits an in-progress response", async () => {
    const form = await seedForm();
    const { uid, idToken } = await createUser();
    const response = await seedResponse(uid, form.id);
    const api = caller(idToken);

    await api.application.save(saveRequest(response, { essay: "First draft" }));
    let saved = await getDoc(
      FirestoreCollection.ApplicationResponses,
      response.id,
    );
    expect(saved?.status).toBe(ApplicationStatus.InProgress);
    expect(saved?.sectionResponses[1].questions[0].response).toBe(
      "First draft",
    );

    await api.application.save(
      saveRequest(response, {
        essay: "Second draft",
        roles: [ApplicantRole.Designer],
      }),
    );
    saved = await getDoc(FirestoreCollection.ApplicationResponses, response.id);
    expect(saved?.sectionResponses[1].questions[0].response).toBe(
      "Second draft",
    );
    expect(saved?.rolesApplied).toEqual([ApplicantRole.Designer]);
    expect(saved?.userId).toBe(uid);
  });

  it("can't save another applicant's response", async () => {
    const form = await seedForm();
    const owner = await createUser();
    const other = await createUser();
    const response = await seedResponse(owner.uid, form.id);

    await expectTRPCError(
      caller(other.idToken).application.save(saveRequest(response)),
      "FORBIDDEN",
    );
  });

  it("rejects saving a response that doesn't exist", async () => {
    const form = await seedForm();
    const { idToken } = await createUser();

    await expectTRPCError(
      caller(idToken).application.save(
        saveRequest({ id: "missing", applicationFormId: form.id }),
      ),
      "BAD_REQUEST",
    );
  });

  it("can't move a response to a different form", async () => {
    const form = await seedForm();
    const otherForm = await seedForm();
    const { uid, idToken } = await createUser();
    const response = await seedResponse(uid, form.id);

    await expectTRPCError(
      caller(idToken).application.save(
        saveRequest({ id: response.id, applicationFormId: otherForm.id }),
      ),
      "FORBIDDEN",
    );
  });

  it("can't save a response that's already been submitted", async () => {
    const form = await seedForm();
    const { uid, idToken } = await createUser();
    const response = await seedResponse(uid, form.id, {
      status: ApplicationStatus.Submitted,
    });

    await expectTRPCError(
      caller(idToken).application.save(saveRequest(response)),
      "BAD_REQUEST",
      "Application already submitted",
    );
    const saved = await getDoc(
      FirestoreCollection.ApplicationResponses,
      response.id,
    );
    expect(saved?.status).toBe(ApplicationStatus.Submitted);
  });

  it("requires a signed-in user", async () => {
    const form = await seedForm();
    const { uid } = await createUser();
    const response = await seedResponse(uid, form.id);

    await expectTRPCError(
      caller().application.save(saveRequest(response)),
      "UNAUTHORIZED",
    );
  });
});

describe("application.submit", () => {
  it("submits the response and opens a review status per role", async () => {
    const form = await seedForm();
    const { uid, idToken } = await createUser();
    const response = await seedResponse(uid, form.id);

    const result = await caller(idToken).application.submit(
      submitRequest(response, {
        roles: [ApplicantRole.Engineer, ApplicantRole.Designer],
      }),
    );

    expect(result.status).toBe("success");
    expect(result.application.status).toBe(ApplicationStatus.Submitted);

    const saved = await getDoc(
      FirestoreCollection.ApplicationResponses,
      response.id,
    );
    expect(saved?.status).toBe(ApplicationStatus.Submitted);
    expect(saved?.rolesApplied).toEqual([
      ApplicantRole.Engineer,
      ApplicantRole.Designer,
    ]);

    const statuses = (
      await appCollection(FirestoreCollection.ApplicationStatus)
        .where("responseId", "==", response.id)
        .get()
    ).docs.map((d) => d.data());
    expect(statuses).toHaveLength(2);
    expect(statuses.every((s) => s.status === ReviewStatus.UnderReview)).toBe(
      true,
    );
  });

  it("returns per-question validation errors", async () => {
    const form = await seedForm();
    const { uid, idToken } = await createUser();
    const response = await seedResponse(uid, form.id);

    const error = await expectTRPCError(
      caller(idToken).application.submit(
        submitRequest(response, { essay: "" }),
      ),
      "BAD_REQUEST",
    );
    expect(error.cause).toBeInstanceOf(SubmitValidationError);
    expect((error.cause as SubmitValidationError).validationErrors).toEqual([
      {
        sectionId: ESSAY_SECTION,
        questionId: ESSAY_QUESTION,
        message: "This question is required",
      },
    ]);

    const saved = await getDoc(
      FirestoreCollection.ApplicationResponses,
      response.id,
    );
    expect(saved?.status).toBe(ApplicationStatus.InProgress);
  });

  it("enforces the maximum word count", async () => {
    const form = await seedForm();
    const { uid, idToken } = await createUser();
    const response = await seedResponse(uid, form.id);

    const error = await expectTRPCError(
      caller(idToken).application.submit(
        submitRequest(response, { essay: "word ".repeat(25) }),
      ),
      "BAD_REQUEST",
    );
    expect(
      (error.cause as SubmitValidationError).validationErrors[0].message,
    ).toMatch(/5 words above the maximum/);
  });

  it("rejects disabled roles", async () => {
    const form = await seedForm({ disabledRoles: [ApplicantRole.Designer] });
    const { uid, idToken } = await createUser();
    const response = await seedResponse(uid, form.id);

    const error = await expectTRPCError(
      caller(idToken).application.submit(
        submitRequest(response, { roles: [ApplicantRole.Designer] }),
      ),
      "BAD_REQUEST",
    );
    expect((error.cause as SubmitValidationError).validationErrors).toEqual([
      {
        sectionId: ROLE_SECTION,
        questionId: ROLE_QUESTION,
        message: "You cannot apply for disabled roles",
      },
    ]);
  });

  it("rejects submissions after the due date", async () => {
    const form = await seedForm({
      dueDate: Timestamp.fromMillis(Date.now() - 60_000),
    });
    const { uid, idToken } = await createUser();
    const response = await seedResponse(uid, form.id);

    await expectTRPCError(
      caller(idToken).application.submit(submitRequest(response)),
      "BAD_REQUEST",
      "Submission deadline has passed",
    );
  });

  it("can't submit another applicant's response", async () => {
    const form = await seedForm();
    const owner = await createUser();
    const other = await createUser();
    const response = await seedResponse(owner.uid, form.id);

    await expectTRPCError(
      caller(other.idToken).application.submit(submitRequest(response)),
      "FORBIDDEN",
    );
  });

  it("only lets invited users respond to a private form", async () => {
    const invited = await createUser({ role: PermissionRole.Reviewer });
    const uninvited = await createUser();
    const form = await seedForm({
      isPrivate: true,
      invitedUsers: [invited.uid],
    });

    const invitedResponse = await seedResponse(invited.uid, form.id);
    await expect(
      caller(invited.idToken).application.submit(
        submitRequest(invitedResponse),
      ),
    ).resolves.toMatchObject({ status: "success" });

    const uninvitedResponse = await seedResponse(uninvited.uid, form.id);
    await expectTRPCError(
      caller(uninvited.idToken).application.submit(
        submitRequest(uninvitedResponse),
      ),
      "FORBIDDEN",
    );
  });

  it("only submits once, even when two submits race", async () => {
    const form = await seedForm();
    const { uid, idToken } = await createUser();
    const response = await seedResponse(uid, form.id);
    const api = caller(idToken);

    const results = await Promise.allSettled([
      api.application.submit(submitRequest(response)),
      api.application.submit(submitRequest(response)),
    ]);
    expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1);

    await expectTRPCError(
      api.application.submit(submitRequest(response)),
      "BAD_REQUEST",
      "Application already submitted",
    );

    const statuses = await appCollection(FirestoreCollection.ApplicationStatus)
      .where("responseId", "==", response.id)
      .get();
    expect(statuses.size).toBe(1);
  });

  it("doesn't let non-applicants respond to public forms", async () => {
    const form = await seedForm();
    const reviewer = await createUser({ role: PermissionRole.Reviewer });
    const response = await seedResponse(reviewer.uid, form.id);

    await expectTRPCError(
      caller(reviewer.idToken).application.submit(submitRequest(response)),
      "FORBIDDEN",
    );
  });
});

describe("application.createForm", () => {
  it("creates a new form and refuses to overwrite it with createOnly", async () => {
    const { idToken } = await createUser({
      role: PermissionRole.SuperReviewer,
    });
    const api = caller(idToken);
    const form = {
      id: "new-form",
      isActive: false,
      semester: "Spring 2027",
      description: "",
      sections: [],
      decisionsReleased: false,
      scoreWeights: {},
      interviewScoreWeights: {},
      dueDate: { seconds: 2_000_000_000, nanoseconds: 0 },
    } as unknown as Parameters<typeof api.application.createForm>[0]["form"];

    await expect(
      api.application.createForm({ form, createOnly: true }),
    ).resolves.toEqual({ status: "success", formId: "new-form" });

    const saved = await getDoc(
      FirestoreCollection.ApplicationForms,
      "new-form",
    );
    expect(saved?.dueDate).toBeInstanceOf(Timestamp);
    expect(saved?.dueDate.seconds).toBe(2_000_000_000);

    await expectTRPCError(
      api.application.createForm({ form, createOnly: true }),
      "CONFLICT",
    );
  });

  it("rejects form IDs that aren't safe document IDs", async () => {
    const { idToken } = await createUser({
      role: PermissionRole.SuperReviewer,
    });
    const api = caller(idToken);
    await expectTRPCError(
      api.application.createForm({
        form: {
          id: "bad/id",
          dueDate: { seconds: 0, nanoseconds: 0 },
        } as unknown as Parameters<
          typeof api.application.createForm
        >[0]["form"],
        createOnly: true,
      }),
      "BAD_REQUEST",
    );
  });

  it("is limited to super reviewers", async () => {
    const { idToken } = await createUser();
    const api = caller(idToken);
    await expectTRPCError(
      api.application.createForm({
        form: { id: "x" } as unknown as Parameters<
          typeof api.application.createForm
        >[0]["form"],
      }),
      "FORBIDDEN",
    );
  });
});
