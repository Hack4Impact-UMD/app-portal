import {
  ApplicantRole,
  ApplicationStatus,
  FirestoreCollection,
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

async function submittedApplicant(
  status: ReviewStatus,
  { decisionsReleased = false } = {},
) {
  const form = await seedForm({ decisionsReleased });
  const user = await createUser();
  const response = await seedResponse(user.uid, form.id, {
    status: ApplicationStatus.Submitted,
  });
  const internal = await seedStatus(response.id, form.id, status);
  return { form, user, response, internal };
}

describe("status.get", () => {
  it.each([
    [ReviewStatus.UnderReview, ReviewStatus.UnderReview],
    [ReviewStatus.NotReviewed, ReviewStatus.UnderReview],
    [ReviewStatus.Reviewed, ReviewStatus.UnderReview],
    [ReviewStatus.Interview, ReviewStatus.Interview],
    [ReviewStatus.Accepted, "decided"],
    [ReviewStatus.Waitlisted, "decided"],
    [ReviewStatus.Denied, "decided"],
  ])(
    "hides a %s status as %s before decisions are released",
    async (internalStatus, publicStatus) => {
      const { user, response, internal } =
        await submittedApplicant(internalStatus);

      await expect(
        caller(user.idToken).status.get({
          responseId: response.id,
          role: ApplicantRole.Engineer,
        }),
      ).resolves.toEqual({
        id: internal.id,
        status: publicStatus,
        role: ApplicantRole.Engineer,
        released: false,
      });
    },
  );

  it("shows the real decision once decisions are released", async () => {
    const { user, response, internal } = await submittedApplicant(
      ReviewStatus.Waitlisted,
      { decisionsReleased: true },
    );

    await expect(
      caller(user.idToken).status.get({
        responseId: response.id,
        role: ApplicantRole.Engineer,
      }),
    ).resolves.toEqual({
      id: internal.id,
      status: ReviewStatus.Waitlisted,
      role: ApplicantRole.Engineer,
      released: true,
    });
  });

  it("doesn't show another applicant's status", async () => {
    const { response } = await submittedApplicant(ReviewStatus.Accepted);
    const other = await createUser();

    await expectTRPCError(
      caller(other.idToken).status.get({
        responseId: response.id,
        role: ApplicantRole.Engineer,
      }),
      "FORBIDDEN",
    );
  });

  it("404s for an unknown response or a role that wasn't applied for", async () => {
    const { user, response } = await submittedApplicant(ReviewStatus.Accepted);

    await expectTRPCError(
      caller(user.idToken).status.get({
        responseId: "missing",
        role: ApplicantRole.Engineer,
      }),
      "NOT_FOUND",
    );
    await expectTRPCError(
      caller(user.idToken).status.get({
        responseId: response.id,
        role: ApplicantRole.Designer,
      }),
      "NOT_FOUND",
    );
  });
});

describe("status.confirmDecision", () => {
  const confirmation = (
    ctx: Awaited<ReturnType<typeof submittedApplicant>>,
    status: "accepted" | "denied" = "accepted",
  ) => ({
    status,
    userId: ctx.user.uid,
    formId: ctx.form.id,
    responseId: ctx.response.id,
    internalStatusId: ctx.internal.id,
  });

  it("records an accepted applicant's confirmation once", async () => {
    const ctx = await submittedApplicant(ReviewStatus.Accepted, {
      decisionsReleased: true,
    });
    const api = caller(ctx.user.idToken);

    await expect(
      api.status.confirmDecision(confirmation(ctx)),
    ).resolves.toEqual({
      message: "Confirmation recorded successfully.",
    });
    expect(
      await getDoc(
        FirestoreCollection.DecisionStatus,
        `${ctx.response.id}_${ctx.user.uid}`,
      ),
    ).toEqual(confirmation(ctx));

    await expectTRPCError(
      api.status.confirmDecision(confirmation(ctx, "denied")),
      "BAD_REQUEST",
      "Confirmation already exists for this responseId.",
    );
  });

  it("rejects applicants who weren't accepted", async () => {
    const ctx = await submittedApplicant(ReviewStatus.Waitlisted, {
      decisionsReleased: true,
    });

    await expectTRPCError(
      caller(ctx.user.idToken).status.confirmDecision(confirmation(ctx)),
      "FORBIDDEN",
      "You cannot confirm because you were not accepted.",
    );
  });

  it("can't confirm on someone else's behalf", async () => {
    const ctx = await submittedApplicant(ReviewStatus.Accepted, {
      decisionsReleased: true,
    });
    const other = await createUser();

    await expectTRPCError(
      caller(other.idToken).status.confirmDecision(confirmation(ctx)),
      "FORBIDDEN",
      "You cannot edit another person's decision",
    );
    const confirmations = await appCollection(
      FirestoreCollection.DecisionStatus,
    ).get();
    expect(confirmations.empty).toBe(true);
  });

  it("checks the response's own form, not the one passed in", async () => {
    const ctx = await submittedApplicant(ReviewStatus.Accepted);
    const releasedForm = await seedForm({ decisionsReleased: true });
    const api = caller(ctx.user.idToken);

    await expectTRPCError(
      api.status.confirmDecision({
        ...confirmation(ctx),
        formId: releasedForm.id,
      }),
      "BAD_REQUEST",
      "Form does not match this response.",
    );
    await expectTRPCError(
      api.status.confirmDecision(confirmation(ctx)),
      "BAD_REQUEST",
      "Decisions not yet released",
    );
  });

  it("can't confirm with another applicant's status", async () => {
    const accepted = await submittedApplicant(ReviewStatus.Accepted, {
      decisionsReleased: true,
    });
    const ctx = await submittedApplicant(ReviewStatus.Denied, {
      decisionsReleased: true,
    });

    await expectTRPCError(
      caller(ctx.user.idToken).status.confirmDecision({
        ...confirmation(ctx),
        internalStatusId: accepted.internal.id,
      }),
      "FORBIDDEN",
      "No decision found for this response.",
    );
    const confirmations = await appCollection(
      FirestoreCollection.DecisionStatus,
    ).get();
    expect(confirmations.empty).toBe(true);
  });
});
