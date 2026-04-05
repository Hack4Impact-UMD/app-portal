import { z } from "zod";
import { ApplicantRole } from "./appResponse";

// TODO: PermissionRole and UserProfile shouldn't be here lol
// also, there are a few spots that use the raw strings that need to be fixed
// also, could be nice to have ">= role" helpers similar to firestore.rules
export enum PermissionRole {
    SuperReviewer = "super-reviewer",
    Board = "board",
    Reviewer = "reviewer",
    Applicant = "applicant"
}

export type UserProfile = {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: PermissionRole;
};

export type ReviewAssignment = {
    applicantId: string, // the applicant that was assigned for review
    applicationId: string // the submitted application that was assigned for review
}

export interface ReviewerUserProfile extends UserProfile {
    role: PermissionRole.Reviewer;
    reviewAssignments: {
        applicationReviewAssignments: ReviewAssignment[];
        interviewAssignmentIds: ReviewAssignment[];
    };
}

// One of these per review. Reviews tie together an application, role, and reviewer.
export interface ApplicationReviewData {
    id: string;
    reviewerId: string;
    applicationFormId: string;
    applicationResponseId: string;
    applicantId: string;
    applicantScores: {
        [scoreCategory in string]: number // between 0-4, each review category in the rubric will have a value here
    };
    reviewerNotes?: string[];
    forRole: ApplicantRole; // what role is this review for
}

export const reviewSchema = z.object({
    reviewerId: z.string(),
    applicationFormId: z.string(),
    applicationResponseId: z.string(),
    applicantId: z.string(),
    applicantScores: z.record(z.string(), z.number().min(0).max(10)),
    reviewerNotes: z.array(z.string()).optional(),
    forRole: z.nativeEnum(ApplicantRole)
});

export const reviewRubricQuestionSchema = z.object({
    scoreKey: z.string().min(1),
    prompt: z.string().min(1),
    description: z.string().optional(),
    maxValue: z.number().int().min(0).max(10).optional(),
    minValue: z.number().int().min(0).max(10).optional(),
}).refine((q) =>
    q.maxValue === undefined || q.minValue === undefined || q.maxValue >= q.minValue,
    { message: "maxValue must be >= minValue" }
);

export const roleReviewRubricSchema = z.object({
    id: z.string().min(1),
    formId: z.string().min(1),
    roles: z.array(z.nativeEnum(ApplicantRole)),
    rubricQuestions: z.array(reviewRubricQuestionSchema).min(1),
    detailLink: z.string().url().optional(),
    commentsDescription: z.string().optional(),
}).superRefine((rubric, ctx) => {
    const seen = new Set<string>();
    for (const [idx, q] of rubric.rubricQuestions.entries()) {
        if (seen.has(q.scoreKey)) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                path: ["rubricQuestions", idx, "scoreKey"],
                message: `Duplicate scoreKey "${q.scoreKey}" in rubric "${rubric.id}"`,
            });
        }
        seen.add(q.scoreKey);
    }
});

export const updateReviewSchema = reviewSchema.partial();
export type ApplicationReviewForm = z.infer<typeof reviewSchema>;
export type RoleReviewRubric = z.infer<typeof roleReviewRubricSchema>;
export type ReviewRubricQuestion = z.infer<typeof reviewRubricQuestionSchema>;
