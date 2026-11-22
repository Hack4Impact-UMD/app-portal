import { QuestionType } from "@app-portal/shared/constants";
import type {
  ApplicationResponseSubmitRequest,
  QuestionResponse,
  ValidationError,
} from "@app-portal/shared/types";
import { logger } from "firebase-functions";

import type { ApplicationForm } from "../models/appForm";

interface QuestionMetadata {
  optional: boolean;
  minimumWordCount?: number;
  maximumWordCount?: number;
}

export function validateResponses(
  applicationResponse: ApplicationResponseSubmitRequest,
  applicationForm: ApplicationForm,
): ValidationError[] {
  const errors: ValidationError[] = [];

  // fill formQuestions map
  const formQuestions = new Map<string, QuestionMetadata>(
    applicationForm.sections.flatMap((section) =>
      section.questions.map((q) => {
        const metadata: QuestionMetadata = {
          optional: q.optional,
        };

        if (
          q.questionType === QuestionType.ShortAnswer ||
          q.questionType === QuestionType.LongAnswer
        ) {
          metadata.minimumWordCount = q.minimumWordCount;
          metadata.maximumWordCount = q.maximumWordCount;
        }

        return [q.questionId, metadata];
      }),
    ),
  );

  const findRoleSelect = () => {
    let roleSelectQuestion: QuestionResponse | undefined;
    let sectionId: string | undefined;
    for (const section of applicationResponse.sectionResponses) {
      roleSelectQuestion = section.questions.find(
        (q) => q.questionType === QuestionType.RoleSelect,
      );
      sectionId = section.sectionId;
      if (roleSelectQuestion) break;
    }

    return { roleSelectQuestion, sectionId };
  };

  if (applicationResponse.rolesApplied.length === 0) {
    const { roleSelectQuestion, sectionId } = findRoleSelect();
    return [
      {
        questionId: roleSelectQuestion!.questionId,
        sectionId: sectionId!,
        message: "You must apply for at least one role",
      },
    ];
  }

  if (applicationForm.disabledRoles !== undefined) {
    const disabledRoles = applicationForm.disabledRoles;
    const appliedDisabled = applicationResponse.rolesApplied.some((r) =>
      disabledRoles.includes(r),
    );
    const { roleSelectQuestion, sectionId } = findRoleSelect();

    if (appliedDisabled) {
      return [
        {
          questionId: roleSelectQuestion!.questionId,
          sectionId: sectionId!,
          message: "You cannot apply for disabled roles",
        },
      ];
    }
  }

  // validate each response
  for (const section of applicationResponse.sectionResponses) {
    const formSection = applicationForm.sections.find(
      (s) => s.sectionId === section.sectionId,
    );
    if (!formSection) {
      throw new Error("Invalid form section: " + section.sectionId);
    }

    if (formSection.forRoles) {
      if (
        formSection.forRoles.filter((role) =>
          applicationResponse.rolesApplied.includes(role),
        ).length === 0
      ) {
        continue;
      }
    }

    for (const question of section.questions) {
      const metaData = formQuestions.get(question.questionId);
      if (!metaData) {
        logger.error(`Question ${question.questionId} has no metadata`);
        continue;
      }

      if (metaData?.optional) continue; // no need for validation

      if (metaData?.optional === false && question.response.length === 0) {
        errors.push({
          sectionId: section.sectionId,
          questionId: question.questionId,
          message: "This question is required",
        });
      }

      const responseText = question.response.toString().trim();
      const wordCount =
        responseText === "" ? 0 : responseText.split(/\s+/).length;
      const min = metaData?.minimumWordCount ?? 0;
      const max = metaData?.maximumWordCount ?? Infinity;

      if (wordCount < min || wordCount > max) {
        const diff = wordCount < min ? min - wordCount : wordCount - max;
        const wordLabel = diff === 1 ? "word" : "words";
        const message =
          wordCount < min
            ? `This response is too short. You are ${diff} ${wordLabel} below the minimum word count.`
            : `This response is too long. You are ${diff} ${wordLabel} above the maximum word count.`;

        errors.push({
          sectionId: section.sectionId,
          questionId: question.questionId,
          message,
        });
      }
    }
  }

  return errors;
}
