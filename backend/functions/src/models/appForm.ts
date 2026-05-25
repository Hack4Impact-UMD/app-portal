import type { ApplicationFormBase } from "@app-portal/shared/types";
import type { Timestamp } from "firebase-admin/firestore";

export interface ApplicationForm extends ApplicationFormBase {
  dueDate: Timestamp;
}
