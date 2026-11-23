import {
  ApplicantRole,
  ApplicationStatus,
  FirestoreCollection,
  PermissionRole,
  ReviewStatus,
} from "@app-portal/shared/constants";
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

const superReviewer = () => createUser({ role: PermissionRole.SuperReviewer });

describe("users admin", () => {
  it("setRole fills in default preferences and is SR-only", async () => {
    const sr = await superReviewer();
    const target = await createUser();

    await caller(sr.idToken).users.setRole({
      ids: [target.uid],
      role: PermissionRole.Reviewer,
    });
    expect(await getDoc(FirestoreCollection.Users, target.uid)).toMatchObject({
      role: PermissionRole.Reviewer,
      applicantRolePreferences: Object.values(ApplicantRole),
    });

    await expectTRPCError(
      caller(target.idToken).users.setRole({
        ids: [target.uid],
        role: PermissionRole.SuperReviewer,
      }),
      "FORBIDDEN",
    );
  });

  it("setInactive and delete are SR-only", async () => {
    const sr = await superReviewer();
    const target = await createUser();

    await expectTRPCError(
      caller(target.idToken).users.setInactive({
        id: target.uid,
        inactive: true,
      }),
      "FORBIDDEN",
    );
    await caller(sr.idToken).users.setInactive({
      id: target.uid,
      inactive: true,
    });
    expect(
      (await getDoc(FirestoreCollection.Users, target.uid))?.inactive,
    ).toBe(true);

    await caller(sr.idToken).users.delete({ ids: [target.uid] });
    expect(await getDoc(FirestoreCollection.Users, target.uid)).toBeUndefined();
  });

  it("reviewers and board members edit only their own roles", async () => {
    const reviewer = await createUser({ role: PermissionRole.Reviewer });
    const board = await createUser({ role: PermissionRole.Board });

    await caller(reviewer.idToken).users.setRolePreferences({
      id: reviewer.uid,
      roles: [ApplicantRole.Designer],
    });
    expect(await getDoc(FirestoreCollection.Users, reviewer.uid)).toMatchObject(
      { applicantRolePreferences: [ApplicantRole.Designer] },
    );

    await caller(board.idToken).users.toggleRolePreference({
      id: board.uid,
      role: ApplicantRole.Engineer,
      enabled: true,
    });
    expect(await getDoc(FirestoreCollection.Users, board.uid)).toMatchObject({
      applicantRoles: [ApplicantRole.Engineer],
    });

    await expectTRPCError(
      caller(reviewer.idToken).users.setRolePreferences({
        id: board.uid,
        roles: [],
      }),
      "FORBIDDEN",
    );
    await expectTRPCError(
      caller(board.idToken).users.toggleRolePreference({
        id: reviewer.uid,
        role: ApplicantRole.Engineer,
        enabled: false,
      }),
      "FORBIDDEN",
    );
  });

  it("toggleRolePreference edits the field matching the user's role", async () => {
    const sr = await superReviewer();
    const board = await createUser({ role: PermissionRole.Board });
    await appCollection(FirestoreCollection.Users)
      .doc(board.uid)
      .update({ applicantRoles: [ApplicantRole.Designer] });
    const api = caller(sr.idToken).users;

    await api.toggleRolePreference({
      id: board.uid,
      role: ApplicantRole.Engineer,
      enabled: true,
    });
    await api.toggleRolePreference({
      id: board.uid,
      role: ApplicantRole.Designer,
      enabled: false,
    });
    expect(await getDoc(FirestoreCollection.Users, board.uid)).toMatchObject({
      applicantRoles: [ApplicantRole.Engineer],
    });

    await expectTRPCError(
      api.toggleRolePreference({
        id: sr.uid,
        role: ApplicantRole.Engineer,
        enabled: true,
      }),
      "BAD_REQUEST",
    );
  });
});

describe("forms admin", () => {
  it("setActive deactivates every other form", async () => {
    const sr = await superReviewer();
    const a = await seedForm({ isActive: true });
    const b = await seedForm({ isActive: false });

    await caller(sr.idToken).forms.setActive({ id: b.id, active: true });
    expect(
      (await getDoc(FirestoreCollection.ApplicationForms, a.id))?.isActive,
    ).toBe(false);
    expect(
      (await getDoc(FirestoreCollection.ApplicationForms, b.id))?.isActive,
    ).toBe(true);
  });

  it("setDecisionsReleased requires every applicant decided", async () => {
    const sr = await superReviewer();
    const form = await seedForm();
    const applicant = await createUser();
    const response = await seedResponse(applicant.uid, form.id, {
      status: ApplicationStatus.Submitted,
    });
    const status = await seedStatus(
      response.id,
      form.id,
      ReviewStatus.UnderReview,
    );
    const api = caller(sr.idToken);

    await expectTRPCError(
      api.forms.setDecisionsReleased({ id: form.id, released: true }),
      "PRECONDITION_FAILED",
    );

    await api.status.update({
      id: status.id,
      patch: { status: ReviewStatus.Accepted },
    });
    await api.forms.setDecisionsReleased({ id: form.id, released: true });
    expect(
      (await getDoc(FirestoreCollection.ApplicationForms, form.id))
        ?.decisionsReleased,
    ).toBe(true);
  });

  it("setDueDate stores a Timestamp and is SR-only", async () => {
    const sr = await superReviewer();
    const reviewer = await createUser({ role: PermissionRole.Reviewer });
    const form = await seedForm();
    const due = new Date("2030-01-01T00:00:00Z");

    await expectTRPCError(
      caller(reviewer.idToken).forms.setDueDate({ id: form.id, dueDate: due }),
      "FORBIDDEN",
    );
    await caller(sr.idToken).forms.setDueDate({ id: form.id, dueDate: due });
    expect(
      (await getDoc(FirestoreCollection.ApplicationForms, form.id))?.dueDate
        .toDate()
        .toISOString(),
    ).toBe(due.toISOString());
  });
});

describe("status admin", () => {
  it("rejectUndecided denies only undecided statuses", async () => {
    const sr = await superReviewer();
    const form = await seedForm();
    const applicant = await createUser();
    const response = await seedResponse(applicant.uid, form.id, {
      status: ApplicationStatus.Submitted,
    });
    const pending = await seedStatus(
      response.id,
      form.id,
      ReviewStatus.UnderReview,
    );
    const accepted = await seedStatus(
      response.id,
      form.id,
      ReviewStatus.Accepted,
      ApplicantRole.Designer,
    );

    const { count } = await caller(sr.idToken).status.rejectUndecided({
      formId: form.id,
    });
    expect(count).toBe(1);
    expect(
      (await getDoc(FirestoreCollection.ApplicationStatus, pending.id))?.status,
    ).toBe(ReviewStatus.Denied);
    expect(
      (await getDoc(FirestoreCollection.ApplicationStatus, accepted.id))
        ?.status,
    ).toBe(ReviewStatus.Accepted);
  });

  it("update is SR-only", async () => {
    const board = await createUser({ role: PermissionRole.Board });
    await expectTRPCError(
      caller(board.idToken).status.update({
        id: "x",
        patch: { isQualified: true },
      }),
      "FORBIDDEN",
    );
  });
});

describe("grading.listForResponse", () => {
  it("is owner or reviewer only", async () => {
    const form = await seedForm();
    const owner = await createUser();
    const other = await createUser();
    const response = await seedResponse(owner.uid, form.id);

    expect(
      await caller(owner.idToken).grading.listForResponse({
        responseId: response.id,
      }),
    ).toEqual([]);
    await expectTRPCError(
      caller(other.idToken).grading.listForResponse({
        responseId: response.id,
      }),
      "FORBIDDEN",
    );
  });
});
