import type {
  ApplicantRole,
  ApplicationQuestion,
  ApplicationSection,
} from "@app-portal/shared/types";
import { QuestionType } from "@app-portal/shared/types";
import type { QuestionResponse, SectionResponse } from "@/types/types";

// generates dummy question and section responses for use in internal applications

function generateQuestionResponse(
  question: ApplicationQuestion,
  formId: string,
  rolesApplied: ApplicantRole[],
): QuestionResponse {
  const baseResponse: QuestionResponse = {
    questionType: question.questionType,
    applicationFormId: formId,
    questionId: question.questionId,
    response: "",
  };

  switch (question.questionType) {
    case QuestionType.ShortAnswer:
    case QuestionType.LongAnswer: {
      const minWords = question.minimumWordCount || 0;
      const repetitions = minWords > 0 ? Math.ceil(minWords / 3) : 1;

      baseResponse.response = Array(repetitions)
        .fill("Commit that code!")
        .join(" ");

      break;
    }

    case QuestionType.MultipleChoice: {
      if (question.questionOptions && question.questionOptions.length > 0) {
        baseResponse.response = question.questionOptions[0]; // select first option lol
      }
      break;
    }

    case QuestionType.MultipleSelect: {
      if (question.questionOptions && question.questionOptions.length > 0) {
        baseResponse.response = question.questionOptions; // select all options lol
      } else {
        baseResponse.response = [];
      }
      break;
    }

    case QuestionType.FileUpload: {
      baseResponse.response = "";
      break;
    }

    case QuestionType.RoleSelect: {
      baseResponse.response = rolesApplied;
      break;
    }
  }

  return baseResponse;
}

export function generateSectionResponses(
  sections: ApplicationSection[],
  rolesApplied: ApplicantRole[],
  formId: string,
): SectionResponse[] {
  const sectionResponses: SectionResponse[] = [];

  for (const section of sections) {
    // skip sections we don't have to fill out
    const required =
      !section.forRoles ||
      section.forRoles.length === 0 ||
      section.forRoles.some((role) => rolesApplied.includes(role));

    if (!required) continue;

    const questionResponses: QuestionResponse[] = section.questions
      .filter((question) => !question.optional)
      .map((question) =>
        generateQuestionResponse(question, formId, rolesApplied),
      );

    sectionResponses.push({
      sectionId: section.sectionId,
      sectionName: section.sectionName,
      questions: questionResponses,
    });
  }

  return sectionResponses;
}
