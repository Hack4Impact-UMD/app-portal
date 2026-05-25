import type { ReviewRubricQuestion } from "@app-portal/shared/types";
import { ChevronDown, ChevronUp } from "lucide-react";
import { memo, useState } from "react";

import FormMarkdown from "@/components/form/FormMarkdown";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import { RubricScoreButton } from "./RubricScoreButton";

type RubricQuestionProps = {
  question: ReviewRubricQuestion;
  onChange: (key: string, value: number) => void;
  value?: number;
  disabled?: boolean;
  className?: string;
  weight?: number;
};

function RubricQuestion({
  question,
  onChange,
  value,
  disabled = false,
  className = "",
  weight = undefined,
}: RubricQuestionProps) {
  const [showDesc, setShowDesc] = useState(true);

  return (
    <div className={className}>
      <div className="w-full flex items-center mb-2">
        <span className="text-lg grow">{question.prompt}</span>
        {weight !== undefined ? (
          <span className="font-mono text-sm bg-lightblue px-2 rounded-full text-blue">
            {weight * 100}%
          </span>
        ) : (
          <></>
        )}
        {question.description && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={"ghost"}
                onClick={() => setShowDesc((prev) => !prev)}
              >
                {showDesc ? <ChevronUp /> : <ChevronDown />}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {showDesc
                ? "Collapse rubric description"
                : "Expand rubric description"}
            </TooltipContent>
          </Tooltip>
        )}
      </div>
      {showDesc && <FormMarkdown>{question.description}</FormMarkdown>}
      <div className="bg-muted flex flex-row gap-4 items-stretch rounded-xl p-3">
        {Array.from(
          { length: (question.maxValue ?? 4) - (question.minValue ?? 0) + 1 },
          (_, i) => i + (question.minValue ?? 0),
        ).map((score) => (
          <RubricScoreButton
            key={score}
            score={score}
            selected={value === score}
            disabled={disabled}
            onClick={() => {
              if (!disabled) onChange(question.scoreKey, score);
            }}
          />
        ))}
      </div>
    </div>
  );
}

export default memo(RubricQuestion);
