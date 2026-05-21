import type { ApplicantRole, RoleReviewRubric } from "@app-portal/shared/types";
import type {
  ApplicationInterviewData,
  ApplicationForm,
  ApplicationReviewData,
} from "@/types/types";
import { displayApplicantRoleNameNoEmoji } from "@/utils/display";
import RubricQuestion from "./RubricQuestion";
import FormMarkdown from "@/components/form/FormMarkdown";
import { RichTextarea } from "@/components/ui/rich-textarea";
import { useMemo } from "react";

type RoleRubricProps = {
  rubric: RoleReviewRubric;
  onScoreChange: (key: string, value: number) => void;
  onCommentChange: (rubricId: string, comments: string) => void;
  reviewData?: ApplicationReviewData;
  interviewData?: ApplicationInterviewData;
  disabled?: boolean;
  form?: ApplicationForm; //optional, for displaying score weights
  role: ApplicantRole;
};

export default function RoleRubric({
  rubric,
  role,
  onScoreChange,
  onCommentChange,
  reviewData,
  interviewData,
  disabled = false,
  form = undefined,
}: RoleRubricProps) {
  const description = useMemo(
    () => <FormMarkdown>{rubric.commentsDescription}</FormMarkdown>,
    [rubric.commentsDescription],
  );

  const weights = useMemo(
    () =>
      reviewData
        ? form?.scoreWeights[role]
        : interviewData
          ? form?.interviewScoreWeights[role]
          : undefined,
    [
      form?.interviewScoreWeights,
      form?.scoreWeights,
      interviewData,
      reviewData,
      role,
    ],
  );
  const scoreValues = useMemo(
    () =>
      reviewData
        ? reviewData.applicantScores
        : interviewData
          ? interviewData.interviewScores
          : undefined,
    [interviewData, reviewData],
  );

  const questions = useMemo(
    () =>
      rubric.rubricQuestions.map((q) => (
        <RubricQuestion
          disabled={disabled}
          key={q.scoreKey}
          question={q}
          onChange={onScoreChange}
          weight={weights?.[q.scoreKey]}
          value={scoreValues?.[q.scoreKey] ?? 0}
        />
      )),
    [disabled, onScoreChange, rubric.rubricQuestions, scoreValues, weights],
  );

  return (
    <div className="bg-white rounded-md border border-gray-200 p-4 flex flex-col gap-2">
      <h1 className="font-bold text-xl">
        {rubric.roles.length > 0
          ? rubric.roles.map(displayApplicantRoleNameNoEmoji).join(", ")
          : "General"}{" "}
        Rubric
      </h1>
      {rubric.detailLink && (
        <span>
          Details:{" "}
          <a href={rubric.detailLink} target="_blank" rel="noopener noreferrer">
            {rubric.detailLink}
          </a>
        </span>
      )}
      <div className="flex flex-col gap-2">{questions}</div>
      <h2 className="text-lg">Review Comments</h2>
      {description}
      <RichTextarea
        disabled={disabled}
        className="disabled:opacity-100 min-h-64 prose-lg"
        value={
          reviewData
            ? reviewData.reviewerNotes[rubric.id]
            : interviewData
              ? interviewData.interviewerNotes[rubric.id]
              : ""
        }
        onChange={(e) => onCommentChange(rubric.id, e)}
      />
    </div>
  );
}
