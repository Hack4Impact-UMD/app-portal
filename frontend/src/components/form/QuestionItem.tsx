import { ApplicantRole, QuestionType } from "@app-portal/shared/constants";
import type {
  ApplicationQuestion,
  OptionQuestion,
} from "@app-portal/shared/types";
import React, { memo, useCallback } from "react";

import {
  applicantRoleColor,
  applicantRoleDarkColor,
  displayApplicantRoleName,
  displayApplicantRoleNameNoEmoji,
} from "@/utils/display";

import ChoiceGroup from "./ChoiceGroup";
import FileUpload from "./FileUpload";
import LongFormInput from "./LongFormInput";
import MultiSelectGroup from "./MultiSelectGroup";
import OneLineInput from "./OneLineInput";

interface QuestionItemProps {
  question: ApplicationQuestion;
  response: string | string[];
  errorMessage?: string;
  disabled: boolean;
  responseId: string;
  disabledRoles: ApplicantRole[];
  onChangeResponse: (questionId: string, value: string | string[]) => void;
  onRoleSelect?: (roles: ApplicantRole[]) => void;
}

const QuestionItem: React.FC<QuestionItemProps> = ({
  question,
  response,
  errorMessage,
  disabled,
  responseId,
  disabledRoles,
  onChangeResponse,
  onRoleSelect,
}) => {
  const handleChange = useCallback(
    (value: string | string[]) => {
      onChangeResponse(question.questionId, value);
    },
    [onChangeResponse, question.questionId],
  );

  const handleChoiceSelect = useCallback(
    (value: string | null) => {
      onChangeResponse(question.questionId, value ?? "");
    },
    [onChangeResponse, question.questionId],
  );

  const handleMultiSelect = useCallback(
    (value: string[]) => {
      onChangeResponse(question.questionId, value ?? []);
    },
    [onChangeResponse, question.questionId],
  );

  const handleRoleSelectChange = useCallback(
    (value: string[] | null) => {
      onChangeResponse(question.questionId, value ?? []);
      onRoleSelect?.((value ?? []) as ApplicantRole[]);
    },
    [onChangeResponse, question.questionId, onRoleSelect],
  );

  const roleDisplayName = useCallback(
    (key: string) => displayApplicantRoleName(key as ApplicantRole),
    [],
  );

  const roleDisplayDarkColor = useCallback(
    (key: string) => applicantRoleDarkColor(key as ApplicantRole),
    [],
  );

  const roleDisplayColor = useCallback(
    (key: string) => applicantRoleColor(key as ApplicantRole),
    [],
  );

  if (question.questionType === QuestionType.ShortAnswer) {
    return (
      <OneLineInput
        disabled={disabled}
        question={question.questionText}
        isRequired={!question.optional}
        errorMessage={errorMessage}
        label={question.secondaryText}
        value={typeof response === "string" ? response : ""}
        onChange={handleChange}
        placeholderText={question.placeholderText}
      />
    );
  }

  if (question.questionType === QuestionType.LongAnswer) {
    return (
      <LongFormInput
        disabled={disabled}
        question={question.questionText}
        errorMessage={errorMessage}
        isRequired={!question.optional}
        label={question.secondaryText}
        value={typeof response === "string" ? response : ""}
        maxWordCount={question.maximumWordCount}
        minWordCount={question.minimumWordCount}
        onChange={handleChange}
        placeholderText={question.placeholderText}
      />
    );
  }

  if (
    (question as OptionQuestion).questionOptions &&
    question.questionType === QuestionType.MultipleChoice
  ) {
    return (
      <ChoiceGroup
        disabled={disabled}
        question={question.questionText}
        errorMessage={errorMessage}
        isRequired={!question.optional}
        label={question.secondaryText}
        value={typeof response === "string" ? response : ""}
        options={(question as OptionQuestion).questionOptions ?? []}
        onOptionSelect={handleChoiceSelect}
      />
    );
  }

  if (
    (question as OptionQuestion).questionOptions &&
    question.questionType === QuestionType.MultipleSelect
  ) {
    return (
      <MultiSelectGroup
        disabled={disabled}
        question={question.questionText}
        errorMessage={errorMessage}
        isRequired={!question.optional}
        label={question.secondaryText}
        value={Array.isArray(response) ? response : []}
        options={(question as OptionQuestion).questionOptions ?? []}
        onOptionSelect={handleMultiSelect}
      />
    );
  }

  if (question.questionType === QuestionType.FileUpload) {
    return (
      <FileUpload
        fileId={question.fileId}
        question={question.questionText}
        secondaryText={question.secondaryText}
        errorMessage={errorMessage}
        onChange={handleChange}
        disabled={disabled}
        required={!question.optional}
        responseId={responseId}
        value={response as string}
      />
    );
  }

  if (question.questionType === QuestionType.RoleSelect) {
    return (
      <MultiSelectGroup
        disabled={disabled}
        question={"Which roles do you want to apply for?"}
        errorMessage={errorMessage}
        isRequired={true}
        label={`You are encouraged to apply to multiple roles at the same time if you believe they are a good fit.

${disabledRoles && disabledRoles.length > 0 ? `**Note: Applications for ${disabledRoles.map((role) => displayApplicantRoleNameNoEmoji(role)).join(", ")} are closed.**` : ""}`}
        value={Array.isArray(response) ? response : []}
        options={Object.values(ApplicantRole).filter(
          (role) => !disabledRoles.includes(role),
        )}
        onOptionSelect={handleRoleSelectChange}
        displayName={roleDisplayName}
        displayDarkColor={roleDisplayDarkColor}
        displayColor={roleDisplayColor}
      />
    );
  }

  return null;
};

const areEqual = (
  prevProps: QuestionItemProps,
  nextProps: QuestionItemProps,
): boolean => {
  if (
    prevProps.disabled !== nextProps.disabled ||
    prevProps.responseId !== nextProps.responseId ||
    prevProps.errorMessage !== nextProps.errorMessage ||
    prevProps.question.questionId !== nextProps.question.questionId ||
    prevProps.onChangeResponse !== nextProps.onChangeResponse ||
    prevProps.onRoleSelect !== nextProps.onRoleSelect
  ) {
    return false;
  }

  if (prevProps.disabledRoles.length !== nextProps.disabledRoles.length) {
    return false;
  }
  for (let i = 0; i < prevProps.disabledRoles.length; i++) {
    if (prevProps.disabledRoles[i] !== nextProps.disabledRoles[i]) {
      return false;
    }
  }

  const prevResponse = prevProps.response;
  const nextResponse = nextProps.response;

  if (typeof prevResponse === "string" && typeof nextResponse === "string") {
    return prevResponse === nextResponse;
  }

  if (Array.isArray(prevResponse) && Array.isArray(nextResponse)) {
    if (prevResponse.length !== nextResponse.length) {
      return false;
    }
    for (let i = 0; i < prevResponse.length; i++) {
      if (prevResponse[i] !== nextResponse[i]) {
        return false;
      }
    }
    return true;
  }

  return prevResponse === nextResponse;
};

export default memo(QuestionItem, areEqual);
