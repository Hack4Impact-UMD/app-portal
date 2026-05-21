import type { ApplicantRole } from "@app-portal/shared/constants";
import type { ApplicationSection } from "@app-portal/shared/types";
import type { Timestamp } from "firebase/firestore";
import type { ReviewStatus } from "./types";

// stores data about the content of the application forms
export interface ApplicationForm {
  id: string;
  isActive: boolean;
  dueDate: Timestamp;
  semester: string;
  description: string;
  sections: ApplicationSection[];
  decisionsReleased: boolean;
  disabledRoles?: ApplicantRole[]; // list of disabled roles
  decisionLetter?: {
    // decision letters split like this by Board at time of writing, but can be changed easily
    [ReviewStatus.Accepted]: {
      [role in ApplicantRole.Bootcamp | "team"]: string;
    };
    [ReviewStatus.Denied]: string;
    [ReviewStatus.Waitlisted]: {
      [role in ApplicantRole.Bootcamp | "team"]: string;
    };
  };
  scoreWeights: {
    [role in ApplicantRole]: {
      [score in string]: number; // weight for role + score category, between 0-4
    };
  };
  interviewScoreWeights: {
    [role in ApplicantRole]: {
      [score in string]: number; // weight for role + score category, between 0-4
    };
  };
}
