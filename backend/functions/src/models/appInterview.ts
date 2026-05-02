import { z } from "zod";

export enum InterviewStatus {
    Scheduled = "scheduled",
    Completed = "completed",
    Cancelled = "cancelled"
}

export interface InterviewData {
    id: string;
    applicationId: string;
    reviewerId: string;
    interviewDate: string;
    status: InterviewStatus;
    notes?: string;
    createdAt: string;
    updatedAt: string;
}

export const interviewSchema = z.object({
    applicationId: z.string(),
    reviewerId: z.string(),
    interviewDate: z.iso.datetime(),
    status: z.enum(InterviewStatus),
    notes: z.string().optional(),
});

export const updateInterviewSchema = z.object({
    interviewDate: z.iso.datetime().optional(),
    status: z.enum(InterviewStatus).optional(),
    notes: z.string().optional(),
}); 