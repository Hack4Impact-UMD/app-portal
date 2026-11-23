import {
  ApplicantRole,
  FirestoreCollection,
  PermissionRole,
  ReviewStatus,
} from "@app-portal/shared/constants";
import { Timestamp } from "firebase-admin/firestore";
import { beforeEach, describe, expect, it } from "vitest";

import { appCollection } from "../src/utils/firestore";
import {
  caller,
  createUser,
  expectTRPCError,
  getDoc,
  resetEmulators,
  seedForm,
  seedResponse,
  seedStatus,
} from "./helpers";

beforeEach(resetEmulators);

const users = () => appCollection(FirestoreCollection.Users);

describe("users", () => {
  it("me works before the email is verified", async () => {
    const { uid, idToken } = await createUser({ emailVerified: false });
    expect((await caller(idToken).users.me()).id).toBe(uid);
  });

  it("get allows self and reviewers, not other applicants", async () => {
    const a = await createUser();
    const b = await createUser();
    const reviewer = await createUser({ role: PermissionRole.Reviewer });

    expect((await caller(a.idToken).users.get({ id: a.uid })).id).toBe(a.uid);
    expect((await caller(reviewer.idToken).users.get({ id: a.uid })).id).toBe(
      a.uid,
    );
    await expectTRPCError(
      caller(b.idToken).users.get({ id: a.uid }),
      "FORBIDDEN",
    );
  });

  it("list is review-capable only", async () => {
    const applicant = await createUser();
    await expectTRPCError(caller(applicant.idToken).users.list(), "FORBIDDEN");
  });

  it("listReviewers drops inactive users and filters by role", async () => {
    const viewer = await createUser({ role: PermissionRole.SuperReviewer });
    const eng = await createUser({ role: PermissionRole.Reviewer });
    await users()
      .doc(eng.uid)
      .update({ applicantRolePreferences: [ApplicantRole.Engineer] });
    const design = await createUser({ role: PermissionRole.Reviewer });
    await users()
      .doc(design.uid)
      .update({ applicantRolePreferences: [ApplicantRole.Designer] });
    const inactive = await createUser({ role: PermissionRole.Reviewer });
    await users().doc(inactive.uid).update({ inactive: true });

    const api = caller(viewer.idToken);
    const all = (await api.users.listReviewers({})).map((u) => u.id);
    expect(all).toEqual(
      expect.arrayContaining([viewer.uid, eng.uid, design.uid]),
    );
    expect(all).not.toContain(inactive.uid);

    const engIds = (
      await api.users.listReviewers({ role: ApplicantRole.Engineer })
    ).map((u) => u.id);
    expect(engIds.sort()).toEqual([viewer.uid, eng.uid].sort());
  });

  it("getApplicantForResponse is owner or reviewer only", async () => {
    const form = await seedForm();
    const owner = await createUser();
    const other = await createUser();
    const response = await seedResponse(owner.uid, form.id);

    expect(
      (
        await caller(owner.idToken).users.getApplicantForResponse({
          responseId: response.id,
        })
      ).id,
    ).toBe(owner.uid);
    await expectTRPCError(
      caller(other.idToken).users.getApplicantForResponse({
        responseId: response.id,
      }),
      "FORBIDDEN",
    );
  });
});

describe("forms", () => {
  it("private forms are readable only by reviewers and invitees", async () => {
    const invited = await createUser();
    const uninvited = await createUser();
    const reviewer = await createUser({ role: PermissionRole.Reviewer });
    const form = await seedForm({
      isPrivate: true,
      invitedUsers: [invited.uid],
    });

    await caller(invited.idToken).forms.get({ id: form.id });
    await caller(reviewer.idToken).forms.get({ id: form.id });
    await expectTRPCError(
      caller(uninvited.idToken).forms.get({ id: form.id }),
      "FORBIDDEN",
    );
  });

  it("active hides an uninvited private form", async () => {
    const applicant = await createUser();
    await seedForm({ isPrivate: true, invitedUsers: [] });
    expect(await caller(applicant.idToken).forms.active()).toBeNull();

    const open = await seedForm();
    expect((await caller(applicant.idToken).forms.active())?.id).toBe(open.id);
  });

  it("invited lists only the caller's invitations", async () => {
    const me = await createUser();
    const mine = await seedForm({ isPrivate: true, invitedUsers: [me.uid] });
    await seedForm({ isPrivate: true, invitedUsers: ["someone-else"] });

    const ids = (await caller(me.idToken).forms.invited()).map((f) => f.id);
    expect(ids).toEqual([mine.id]);
  });
});

describe("application reads", () => {
  it("get is owner or reviewer only", async () => {
    const form = await seedForm();
    const owner = await createUser();
    const other = await createUser();
    const response = await seedResponse(owner.uid, form.id);

    expect(
      (await caller(owner.idToken).application.get({ id: response.id }))?.id,
    ).toBe(response.id);
    await expectTRPCError(
      caller(other.idToken).application.get({ id: response.id }),
      "FORBIDDEN",
    );
  });

  it("mineWithSemester joins the form", async () => {
    const form = await seedForm({ semester: "Spring 2027" });
    const me = await createUser();
    await seedResponse(me.uid, form.id);

    const [row] = await caller(me.idToken).application.mineWithSemester();
    expect(row).toMatchObject({ semester: "Spring 2027", active: true });
  });

  it("getOrCreate creates one response and is idempotent", async () => {
    const form = await seedForm();
    const me = await createUser();
    const api = caller(me.idToken);

    const first = await api.application.getOrCreate({ formId: form.id });
    const second = await api.application.getOrCreate({ formId: form.id });
    expect(second.response.id).toBe(first.response.id);

    const all = await appCollection(FirestoreCollection.ApplicationResponses)
      .where("userId", "==", me.uid)
      .get();
    expect(all.size).toBe(1);
    expect(
      (await getDoc(FirestoreCollection.Users, me.uid))?.activeApplications,
    ).toEqual([form.id]);
  });

  it("getOrCreate rejects closed and uninvited private forms", async () => {
    const me = await createUser();
    const closed = await seedForm({
      dueDate: Timestamp.fromMillis(Date.now() - 1000),
    });
    const secret = await seedForm({ isPrivate: true, invitedUsers: [] });
    const api = caller(me.idToken);

    await expectTRPCError(
      api.application.getOrCreate({ formId: closed.id }),
      "BAD_REQUEST",
    );
    await expectTRPCError(
      api.application.getOrCreate({ formId: secret.id }),
      "FORBIDDEN",
    );
  });

  it("getOrCreate doesn't let a reviewer create a response", async () => {
    const form = await seedForm();
    const reviewer = await createUser({ role: PermissionRole.Reviewer });
    await expectTRPCError(
      caller(reviewer.idToken).application.getOrCreate({ formId: form.id }),
      "FORBIDDEN",
    );
  });
});

describe("status reads", () => {
  it("listForForm is board-only", async () => {
    const form = await seedForm();
    const owner = await createUser();
    const response = await seedResponse(owner.uid, form.id);
    await seedStatus(response.id, form.id, ReviewStatus.UnderReview);

    const board = await createUser({ role: PermissionRole.Board });
    const reviewer = await createUser({ role: PermissionRole.Reviewer });

    expect(
      await caller(board.idToken).status.listForForm({ formId: form.id }),
    ).toHaveLength(1);
    await expectTRPCError(
      caller(reviewer.idToken).status.listForForm({ formId: form.id }),
      "FORBIDDEN",
    );
  });

  it("getConfirmation only returns the caller's own", async () => {
    const owner = await createUser();
    const other = await createUser();
    await appCollection(FirestoreCollection.DecisionStatus)
      .doc(`r1_${owner.uid}`)
      .set({
        status: "accepted",
        userId: owner.uid,
        formId: "f",
        responseId: "r1",
        internalStatusId: "s",
      });

    expect(
      await caller(owner.idToken).status.getConfirmation({ responseId: "r1" }),
    ).toMatchObject({ userId: owner.uid });
    expect(
      await caller(other.idToken).status.getConfirmation({ responseId: "r1" }),
    ).toBeNull();
  });
});

describe("rubrics.list", () => {
  it("filters by role and is review-capable only", async () => {
    const rubrics = appCollection(FirestoreCollection.Rubrics);
    const question = { scoreKey: "k", prompt: "p" };
    await rubrics.doc("all").set({
      id: "all",
      formId: "f",
      roles: [],
      rubricQuestions: [question],
    });
    await rubrics.doc("eng").set({
      id: "eng",
      formId: "f",
      roles: [ApplicantRole.Engineer],
      rubricQuestions: [question],
    });

    const reviewer = await createUser({ role: PermissionRole.Reviewer });
    const designer = await caller(reviewer.idToken).rubrics.list({
      formId: "f",
      kind: "review",
      role: ApplicantRole.Designer,
    });
    expect(designer.map((r) => r.id)).toEqual(["all"]);

    const applicant = await createUser();
    await expectTRPCError(
      caller(applicant.idToken).rubrics.list({ formId: "f", kind: "review" }),
      "FORBIDDEN",
    );
  });
});
