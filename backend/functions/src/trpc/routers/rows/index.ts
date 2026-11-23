import { router } from "../../init";
import { acceptanceConfirmations } from "./acceptanceConfirmations";
import { assignedInterviews } from "./assignedInterviews";
import { assignedReviews } from "./assignedReviews";
import { boardMembers } from "./boardMembers";
import { interviewerAssignments } from "./interviewerAssignments";
import { interviewers } from "./interviewers";
import { myInterviewAssignments } from "./myInterviewAssignments";
import { myReviewAssignments } from "./myReviewAssignments";
import { qualified } from "./qualified";
import { reviewerAssignments } from "./reviewerAssignments";
import { reviewers } from "./reviewers";
import { underReview } from "./underReview";

export const rowsRouter = router({
  underReview,
  qualified,
  reviewers,
  interviewers,
  reviewerAssignments,
  interviewerAssignments,
  assignedReviews,
  assignedInterviews,
  acceptanceConfirmations,
  boardMembers,
  myReviewAssignments,
  myInterviewAssignments,
});
