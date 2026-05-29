import { ReviewStatus } from "@app-portal/shared/constants";

export function statusDisplay(status: ReviewStatus | "decided") {
  switch (status) {
    case ReviewStatus.NotReviewed:
      return "Not Reviewed";
    case ReviewStatus.UnderReview:
      return "Under Review";
    case ReviewStatus.Reviewed:
      return "Reviewed";
    case ReviewStatus.Interview:
      return "Interview";
    case ReviewStatus.Accepted:
      return "Accepted!";
    case ReviewStatus.Denied:
      return "Denied";
    case ReviewStatus.Waitlisted:
      return "Waitlisted";
    case "decided":
      return "Decided";
    default:
      return "N/A";
  }
}
