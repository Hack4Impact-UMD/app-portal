import {
  ApplicantRole,
  FirestoreCollection,
  PermissionRole,
} from "@app-portal/shared/constants";
import { RoleReviewRubricSchema } from "@app-portal/shared/types";
import { validateRubricScoreKeys } from "@app-portal/shared/utils";
import { beforeEach, describe, expect, it } from "vitest";

import { appCollection } from "../src/utils/firestore";
import {
  caller,
  createUser,
  expectTRPCError,
  resetEmulators,
  seedForm,
} from "./helpers";

beforeEach(resetEmulators);

const superReviewer = () => createUser({ role: PermissionRole.SuperReviewer });

const { Engineer, Designer } = ApplicantRole;
const reviewWeights = { [Engineer]: { tech: 0.5, culture: 0.5 } };
const interviewWeights = { [Engineer]: { teamwork: 1 } };

const seedRubric = async (
  kind: "review" | "interview",
  formId: string,
  keys: string[],
  roles: ApplicantRole[] = [Engineer],
) => {
  const rubric = {
    id: `${formId}-${kind}-${roles.join("-")}`,
    formId,
    roles,
    rubricQuestions: keys.map((scoreKey) => ({ scoreKey, prompt: scoreKey })),
  };
  await appCollection(
    kind === "review"
      ? FirestoreCollection.Rubrics
      : FirestoreCollection.InterviewRubrics,
  )
    .doc(rubric.id)
    .set(rubric);
  return rubric;
};

const rubricsFor = async (
  collection:
    | FirestoreCollection.Rubrics
    | FirestoreCollection.InterviewRubrics,
  formId: string,
) =>
  (
    await appCollection(collection).where("formId", "==", formId).get()
  ).docs.map((d) => d.data());

describe("rubrics.duplicateFromForm", () => {
  const seedForms = async () => {
    const weights = {
      scoreWeights: reviewWeights as never,
      interviewScoreWeights: interviewWeights as never,
    };
    const source = await seedForm({ isActive: false, ...weights });
    const dest = await seedForm({ isActive: false, ...weights });
    return { source, dest };
  };

  it("copies both kinds to the destination with new IDs", async () => {
    const sr = await superReviewer();
    const { source, dest } = await seedForms();
    const review = await seedRubric("review", source.id, ["tech", "culture"]);
    const interview = await seedRubric("interview", source.id, ["teamwork"]);

    await caller(sr.idToken).rubrics.duplicateFromForm({
      sourceFormId: source.id,
      destFormId: dest.id,
    });

    const copiedReview = await rubricsFor(FirestoreCollection.Rubrics, dest.id);
    const copiedInterview = await rubricsFor(
      FirestoreCollection.InterviewRubrics,
      dest.id,
    );
    expect(copiedReview).toHaveLength(1);
    expect(copiedInterview).toHaveLength(1);
    expect(copiedReview[0]).toMatchObject({
      formId: dest.id,
      roles: review.roles,
      rubricQuestions: review.rubricQuestions,
    });
    expect(copiedReview[0].id).not.toBe(review.id);
    expect(copiedInterview[0]).toMatchObject({
      formId: dest.id,
      rubricQuestions: interview.rubricQuestions,
    });
    expect(copiedInterview[0].id).not.toBe(interview.id);

    // The source's rubrics must be left untouched.
    expect(await rubricsFor(FirestoreCollection.Rubrics, source.id)).toEqual([
      review,
    ]);
    expect(
      await rubricsFor(FirestoreCollection.InterviewRubrics, source.id),
    ).toEqual([interview]);
  });

  it("rejects rubrics whose keys don't match the destination's weights", async () => {
    const sr = await superReviewer();
    const source = await seedForm({ isActive: false });
    const dest = await seedForm({
      isActive: false,
      scoreWeights: reviewWeights as never,
      interviewScoreWeights: interviewWeights as never,
    });
    await seedRubric("review", source.id, ["tech"]);
    await seedRubric("interview", source.id, ["teamwork"]);

    await expectTRPCError(
      caller(sr.idToken).rubrics.duplicateFromForm({
        sourceFormId: source.id,
        destFormId: dest.id,
      }),
      "BAD_REQUEST",
    );
    expect(await rubricsFor(FirestoreCollection.Rubrics, dest.id)).toEqual([]);
    expect(
      await rubricsFor(FirestoreCollection.InterviewRubrics, dest.id),
    ).toEqual([]);
  });

  it("rejects a source with no rubrics for a weighted role", async () => {
    const sr = await superReviewer();
    const { source, dest } = await seedForms();
    await seedRubric("review", source.id, ["design"], [Designer]);
    await seedRubric("interview", source.id, ["teamwork"]);

    await expectTRPCError(
      caller(sr.idToken).rubrics.duplicateFromForm({
        sourceFormId: source.id,
        destFormId: dest.id,
      }),
      "BAD_REQUEST",
    );
  });

  it("refuses to overwrite a destination that already has rubrics", async () => {
    const sr = await superReviewer();
    const { source, dest } = await seedForms();
    await seedRubric("review", source.id, ["tech", "culture"]);
    await seedRubric("interview", source.id, ["teamwork"]);
    const existing = await seedRubric("interview", dest.id, ["teamwork"]);

    await expectTRPCError(
      caller(sr.idToken).rubrics.duplicateFromForm({
        sourceFormId: source.id,
        destFormId: dest.id,
      }),
      "CONFLICT",
    );
    expect(
      await rubricsFor(FirestoreCollection.InterviewRubrics, dest.id),
    ).toEqual([existing]);
    expect(await rubricsFor(FirestoreCollection.Rubrics, dest.id)).toEqual([]);
  });

  it("404s on a missing destination form", async () => {
    const sr = await superReviewer();
    const { source } = await seedForms();

    await expectTRPCError(
      caller(sr.idToken).rubrics.duplicateFromForm({
        sourceFormId: source.id,
        destFormId: "missing-form",
      }),
      "NOT_FOUND",
    );
  });

  it("is SR-only", async () => {
    const { source, dest } = await seedForms();
    await seedRubric("review", source.id, ["tech", "culture"]);
    await seedRubric("interview", source.id, ["teamwork"]);

    for (const role of [PermissionRole.Board, PermissionRole.Reviewer]) {
      const user = await createUser({ role });
      await expectTRPCError(
        caller(user.idToken).rubrics.duplicateFromForm({
          sourceFormId: source.id,
          destFormId: dest.id,
        }),
        "FORBIDDEN",
      );
    }
    expect(await rubricsFor(FirestoreCollection.Rubrics, dest.id)).toEqual([]);
  });
});

describe("rubrics.createForForm", () => {
  const weightedForm = (
    scoreWeights: object = reviewWeights,
    interviewScoreWeights: object = interviewWeights,
  ) =>
    seedForm({
      isActive: false,
      scoreWeights: scoreWeights as never,
      interviewScoreWeights: interviewScoreWeights as never,
    });

  it("creates one valid rubric per role whose keys match the weights", async () => {
    const sr = await superReviewer();
    const scoreWeights = {
      [Engineer]: { tech: 0.5, culture: 0.5 },
      [Designer]: { design: 1 },
    };
    const form = await weightedForm(scoreWeights);

    await caller(sr.idToken).rubrics.createForForm({ formId: form.id });

    const review = await rubricsFor(FirestoreCollection.Rubrics, form.id);
    const interview = await rubricsFor(
      FirestoreCollection.InterviewRubrics,
      form.id,
    );
    expect(review.map((r) => r.roles).sort()).toEqual([[Designer], [Engineer]]);
    expect(interview.map((r) => r.roles)).toEqual([[Engineer]]);

    for (const rubric of [...review, ...interview]) {
      expect(RoleReviewRubricSchema.safeParse(rubric).success).toBe(true);
    }
    expect(validateRubricScoreKeys(review, scoreWeights as never)).toEqual({
      missingInForm: [],
      missingInRubric: [],
    });
    expect(
      validateRubricScoreKeys(interview, interviewWeights as never),
    ).toEqual({ missingInForm: [], missingInRubric: [] });
    expect(new Set([...review, ...interview].map((r) => r.id)).size).toBe(3);
  });

  it("skips roles that have no weighted keys", async () => {
    const sr = await superReviewer();
    const form = await weightedForm(
      { [Engineer]: { tech: 1 }, [Designer]: {} },
      { [Designer]: {} },
    );

    await caller(sr.idToken).rubrics.createForForm({ formId: form.id });

    expect(
      (await rubricsFor(FirestoreCollection.Rubrics, form.id)).map(
        (r) => r.roles,
      ),
    ).toEqual([[Engineer]]);
    expect(
      await rubricsFor(FirestoreCollection.InterviewRubrics, form.id),
    ).toEqual([]);
  });

  it("refuses to add rubrics to a form that already has some", async () => {
    const sr = await superReviewer();
    const form = await weightedForm();
    const api = caller(sr.idToken);

    await api.rubrics.createForForm({ formId: form.id });
    await expectTRPCError(
      api.rubrics.createForForm({ formId: form.id }),
      "CONFLICT",
    );
    expect(await rubricsFor(FirestoreCollection.Rubrics, form.id)).toHaveLength(
      1,
    );
    expect(
      await rubricsFor(FirestoreCollection.InterviewRubrics, form.id),
    ).toHaveLength(1);
  });

  it("refuses when only one kind already has rubrics", async () => {
    const sr = await superReviewer();
    const form = await weightedForm();
    const existing = await seedRubric("interview", form.id, ["teamwork"]);

    await expectTRPCError(
      caller(sr.idToken).rubrics.createForForm({ formId: form.id }),
      "CONFLICT",
    );
    expect(await rubricsFor(FirestoreCollection.Rubrics, form.id)).toEqual([]);
    expect(
      await rubricsFor(FirestoreCollection.InterviewRubrics, form.id),
    ).toEqual([existing]);
  });

  it("404s on a missing form", async () => {
    const sr = await superReviewer();
    await expectTRPCError(
      caller(sr.idToken).rubrics.createForForm({ formId: "missing-form" }),
      "NOT_FOUND",
    );
  });

  it("is SR-only", async () => {
    const form = await weightedForm();

    for (const role of [PermissionRole.Board, PermissionRole.Reviewer]) {
      const user = await createUser({ role });
      await expectTRPCError(
        caller(user.idToken).rubrics.createForForm({ formId: form.id }),
        "FORBIDDEN",
      );
    }
    expect(await rubricsFor(FirestoreCollection.Rubrics, form.id)).toEqual([]);
  });
});
