import type { ApplicantRole } from "@app-portal/shared/constants";
import { createContext } from "react";

import type { ApplicationForm, ApplicationResponse } from "@/types/types";

export type SaveStatus =
  | { saved: false; isSaving: true; isError: false }
  | { saved: true; lastSavedAt: number; isError: false }
  | { saved: false; isError: true };

export type FormProviderContext = {
  response?: ApplicationResponse;
  form?: ApplicationForm;
  updateQuestionResponse: (
    sectionId: string,
    questionId: string,
    newResponse: string | string[],
  ) => void;
  save: () => Promise<void>;
  saveStatus: SaveStatus;
  selectedRoles: ApplicantRole[];
  setSelectedRoles: (roles: ApplicantRole[]) => void;
  availableSections: string[];
  currentSection?: string;
  nextSection: () => string;
  previousSection: () => string;
};

export const FormContext = createContext<FormProviderContext>({
  updateQuestionResponse: () => {},
  save: async () => {},
  saveStatus: { isSaving: true, isError: false, saved: false },
  selectedRoles: [],
  setSelectedRoles: () => {},
  availableSections: [],
  nextSection: () => "",
  previousSection: () => "",
});
