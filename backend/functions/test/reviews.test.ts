import {
  ApplicantRole,
  ApplicationStatus,
  FirestoreCollection,
  PermissionRole,
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
} from "./helpers";

beforeEach(resetEmulators);

async function submittedResponse() {
  const form = await seedForm();
  const applicant = await createUser();
  const response = await seedResponse(applicant.uid, form.id, {
    status: ApplicationStatus.Submitted,
  });
  return { form, applicant, response };
}

async function boardFor(roles: ApplicantRole[]) {
  const board = await createUser({ role: PermissionRole.Board });
  await appCollection(FirestoreCollection.Users)
    .doc(board.uid)
    .update({ applicantRoles: roles });
  return board;
}

describe("reviewAssignments", () => {
  it("create derives fields from the response and is SR-only", async () => {
    const { form, applicant, response } = await submittedResponse();
    const sr = await createUser({ role: PermissionRole.SuperReviewer });
    const reviewer = await createUser({ role: PermissionRole.Reviewer });
    const input = {
      applicationResponseId: response.id,
      reviewerId: reviewer.uid,
      forRole: ApplicantRole.Engineer,
    };

    const assignment = await caller(sr.idToken).reviewAssignments.create(input);
    expect(assignment).toMatchObject({
      applicantId: applicant.uid,
      formId: form.id,
      reviewerId: reviewer.uid,
    });
    await expectTRPCError(
      caller(reviewer.idToken).reviewAssignments.create(input),
      "FORBIDDEN",
    );
  });

  it("list lets reviewers see only their own", async () => {
    const { form } = await submittedResponse();
    const reviewer = await createUser({ role: PermissionRole.Reviewer });
    const api = caller(reviewer.idToken);

    await api.reviewAssignments.list({
      formId: form.id,
      reviewerId: reviewer.uid,
    });
    await expectTRPCError(
      api.reviewAssignments.list({ formId: form.id }),
      "FORBIDDEN",
    );
  });

  it("delete refuses once the review has started", async () => {
    const { response } = await submittedResponse();
    const sr = await createUser({ role: PermissionRole.SuperReviewer });
    const reviewer = await createUser({ role: PermissionRole.Reviewer });
    const assignment = await caller(sr.idToken).reviewAssignments.create({
      applicationResponseId: response.id,
      reviewerId: reviewer.uid,
      forRole: ApplicantRole.Engineer,
    });

    await caller(reviewer.idToken).reviewData.create({
      applicationResponseId: response.id,
      forRole: ApplicantRole.Engineer,
    });
    await expectTRPCError(
      caller(sr.idToken).reviewAssignments.delete({ id: assignment.id }),
      "PRECONDITION_FAILED",
    );
  });

  it("createMany writes every assignment", async () => {
    const { response } = await submittedResponse();
    const sr = await createUser({ role: PermissionRole.SuperReviewer });
    const r1 = await createUser({ role: PermissionRole.Reviewer });
    const r2 = await createUser({ role: PermissionRole.Reviewer });

    const { count } = await caller(sr.idToken).reviewAssignments.createMany(
      [r1, r2].map((r) => ({
        applicationResponseId: response.id,
        reviewerId: r.uid,
        forRole: ApplicantRole.Bootcamp,
      })),
    );
    expect(count).toBe(2);
    const docs = await appCollection(FirestoreCollection.ReviewAssignments)
      .where("applicationResponseId", "==", response.id)
      .get();
    expect(docs.size).toBe(2);
  });
});

describe("reviewAssignments.autoAssignPlan", () => {
  it("plans two reviewers per bootcamp app and honors exemptions", async () => {
    const form = await seedForm();
    const applicant = await createUser();
    const response = await seedResponse(applicant.uid, form.id, {
      status: ApplicationStatus.Submitted,
      rolesApplied: [ApplicantRole.Bootcamp],
    });
    const sr = await createUser({ role: PermissionRole.SuperReviewer });
    const reviewer = await createUser({ role: PermissionRole.Reviewer });
    const api = caller(sr.idToken).reviewAssignments;

    const [item] = await api.autoAssignPlan({ formId: form.id });
    expect(item).toMatchObject({
      applicationResponseId: response.id,
      skipped: false,
    });
    expect([item.reviewer1?.id, item.reviewer2?.id].sort()).toEqual(
      [sr.uid, reviewer.uid].sort(),
    );

    const [exempted] = await api.autoAssignPlan({
      formId: form.id,
      exemptReviewerIds: [reviewer.uid],
    });
    expect(exempted).toMatchObject({
      skipped: true,
      skipReason: "Not enough reviewers available",
    });
  });

  it("is SR-only", async () => {
    const form = await seedForm();
    const board = await createUser({ role: PermissionRole.Board });
    await expectTRPCError(
      caller(board.idToken).reviewAssignments.autoAssignPlan({
        formId: form.id,
      }),
      "FORBIDDEN",
    );
  });
});

describe("interviewAssignments", () => {
  it("only board members managing the role may assign", async () => {
    const { response } = await submittedResponse();
    const interviewer = await createUser({ role: PermissionRole.Reviewer });
    const input = {
      applicationResponseId: response.id,
      interviewerId: interviewer.uid,
      forRole: ApplicantRole.Engineer,
    };

    const owner = await boardFor([ApplicantRole.Engineer]);
    const other = await boardFor([ApplicantRole.Designer]);
    const sr = await createUser({ role: PermissionRole.SuperReviewer });

    const assignment = await caller(owner.idToken).interviewAssignments.create(
      input,
    );
    await expectTRPCError(
      caller(other.idToken).interviewAssignments.create(input),
      "FORBIDDEN",
    );
    await expectTRPCError(
      caller(sr.idToken).interviewAssignments.create(input),
      "FORBIDDEN",
    );
    await expectTRPCError(
      caller(other.idToken).interviewAssignments.delete({ id: assignment.id }),
      "FORBIDDEN",
    );
  });

  it("listForResponse shows interviewers only their own", async () => {
    const { response } = await submittedResponse();
    const owner = await boardFor([ApplicantRole.Engineer]);
    const mine = await createUser({ role: PermissionRole.Reviewer });
    const theirs = await createUser({ role: PermissionRole.Reviewer });
    for (const i of [mine, theirs]) {
      await caller(owner.idToken).interviewAssignments.create({
        applicationResponseId: response.id,
        interviewerId: i.uid,
        forRole: ApplicantRole.Engineer,
      });
    }

    const list = await caller(
      mine.idToken,
    ).interviewAssignments.listForResponse({ responseId: response.id });
    expect(list.map((a) => a.interviewerId)).toEqual([mine.uid]);
  });
});

describe("reviewData", () => {
  it("create owns the doc for the caller and fills fields from the response", async () => {
    const { form, applicant, response } = await submittedResponse();
    const reviewer = await createUser({ role: PermissionRole.Reviewer });

    const data = await caller(reviewer.idToken).reviewData.create({
      applicationResponseId: response.id,
      forRole: ApplicantRole.Engineer,
    });
    expect(data).toMatchObject({
      reviewerId: reviewer.uid,
      applicantId: applicant.uid,
      applicationFormId: form.id,
      submitted: false,
    });
  });

  it("update is owner-only and can't change protected fields", async () => {
    const { response } = await submittedResponse();
    const owner = await createUser({ role: PermissionRole.Reviewer });
    const other = await createUser({ role: PermissionRole.Reviewer });
    const data = await caller(owner.idToken).reviewData.create({
      applicationResponseId: response.id,
      forRole: ApplicantRole.Engineer,
    });

    await caller(owner.idToken).reviewData.update({
      id: data.id,
      patch: {
        applicantScores: { k: 3 },
        reviewerId: other.uid,
      } as never,
    });
    const saved = await getDoc(FirestoreCollection.ReviewData, data.id);
    expect(saved).toMatchObject({
      applicantScores: { k: 3 },
      reviewerId: owner.uid,
    });

    await expectTRPCError(
      caller(other.idToken).reviewData.update({
        id: data.id,
        patch: { submitted: true },
      }),
      "FORBIDDEN",
    );
  });

  it("inactive reviewers can't save, and others can't read", async () => {
    const { response } = await submittedResponse();
    const owner = await createUser({ role: PermissionRole.Reviewer });
    const other = await createUser({ role: PermissionRole.Reviewer });
    const board = await createUser({ role: PermissionRole.Board });
    const data = await caller(owner.idToken).reviewData.create({
      applicationResponseId: response.id,
      forRole: ApplicantRole.Engineer,
    });

    await caller(board.idToken).reviewData.get({ id: data.id });
    await expectTRPCError(
      caller(other.idToken).reviewData.get({ id: data.id }),
      "FORBIDDEN",
    );

    await appCollection(FirestoreCollection.Users)
      .doc(owner.uid)
      .update({ inactive: true });
    await expectTRPCError(
      caller(owner.idToken).reviewData.update({
        id: data.id,
        patch: { submitted: true },
      }),
      "FORBIDDEN",
    );
  });
});

describe("interviewData", () => {
  it("update is owner-only", async () => {
    const { response } = await submittedResponse();
    const owner = await createUser({ role: PermissionRole.Reviewer });
    const other = await createUser({ role: PermissionRole.Reviewer });
    const data = await caller(owner.idToken).interviewData.create({
      applicationResponseId: response.id,
      forRole: ApplicantRole.Engineer,
    });

    await caller(owner.idToken).interviewData.update({
      id: data.id,
      patch: { interviewScores: { k: 2 } },
    });
    await expectTRPCError(
      caller(other.idToken).interviewData.update({
        id: data.id,
        patch: { submitted: true },
      }),
      "FORBIDDEN",
    );
  });
});
