import type { ApplicantRole } from "@app-portal/shared/constants";
import type {
  ApplicationSection,
  QuestionResponse,
} from "@app-portal/shared/types";
import React, { memo, useMemo, useCallback } from "react";
import type { ValidationError } from "../../types/types";
import FormMarkdown from "./FormMarkdown";
import QuestionItem from "./QuestionItem";

const EMPTY_ROLES: ApplicantRole[] = [];

interface SectionProps {
  section: ApplicationSection;
  responses: QuestionResponse[];
  disabled?: boolean;
  validationErrors?: ValidationError[];
  onChangeResponse?: (questionId: string, value: string | string[]) => void;
  onRoleSelect?: (roles: ApplicantRole[]) => void;
  responseId: string;
  disabledRoles?: ApplicantRole[];
}

const Section: React.FC<SectionProps> = ({
  section,
  responses,
  onChangeResponse,
  onRoleSelect,
  validationErrors,
  disabled = false,
  responseId,
  disabledRoles = EMPTY_ROLES,
}) => {
  const responseMap = useMemo(() => {
    const map = new Map<string, string | string[]>();
    for (const r of responses) {
      map.set(r.questionId, r.response);
    }
    return map;
  }, [responses]);

  const errorMap = useMemo(() => {
    const map = new Map<string, string>();
    if (validationErrors) {
      for (const e of validationErrors) {
        map.set(e.questionId, e.message);
      }
    }
    return map;
  }, [validationErrors]);

  const handleChangeResponse = useCallback(
    (questionId: string, value: string | string[]) => {
      onChangeResponse?.(questionId, value);
    },
    [onChangeResponse],
  );

  return (
    <div className="mt-2 mb-2 flex flex-col gap-5">
      <div>
        <h1 className="font-bold text-3xl">{section.sectionName}</h1>
        <FormMarkdown>{section.description}</FormMarkdown>
      </div>
      {section.questions.map((question) => (
        <div key={question.questionId}>
          <QuestionItem
            question={question}
            response={responseMap.get(question.questionId) ?? ""}
            errorMessage={errorMap.get(question.questionId)}
            disabled={disabled}
            responseId={responseId}
            disabledRoles={disabledRoles}
            onChangeResponse={handleChangeResponse}
            onRoleSelect={onRoleSelect}
          />
        </div>
      ))}
    </div>
  );
};

export default memo(Section);
