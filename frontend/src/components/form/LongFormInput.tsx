import React, { memo, useMemo } from "react";
import { twMerge } from "tailwind-merge";

import { Textarea } from "@/components/ui/textarea";

import FormMarkdown from "./FormMarkdown";

interface LongFormInputProps {
  question: string;
  label?: string;
  isRequired?: boolean;
  value: string;
  onChange: (value: string) => void;
  className?: string;
  disabled?: boolean;
  minWordCount?: number;
  maxWordCount?: number;
  errorMessage?: string;
  placeholderText?: string;
}

const LongFormInput: React.FC<LongFormInputProps> = ({
  question,
  label,
  isRequired,
  value,
  onChange,
  className = "",
  disabled,
  minWordCount,
  maxWordCount,
  errorMessage,
  placeholderText = "",
}) => {
  const wordCount = useMemo(() => {
    const trimmedVal = value.trim();
    const words = trimmedVal.split(/\s+/);
    if (words.length === 1 && words[0] === "") return 0;
    return words.length;
  }, [value]);

  return (
    <main
      className={twMerge(
        "flex flex-col min-w-52 hover:brightness-95 transition",
        className,
      )}
    >
      <span className="text-xl font-normal mb-2">
        {question}
        {isRequired && <span className="text-red-600 ml-px">*</span>}
        {!isRequired && <span className="font-light text-xs"> (Optional)</span>}
      </span>
      <FormMarkdown>{label}</FormMarkdown>
      {minWordCount && maxWordCount ? (
        <p className="mb-1 text-xs">
          Minimum: {minWordCount} word{minWordCount !== 1 && "s"}. Maximum:{" "}
          {maxWordCount} word{maxWordCount !== 1 && "s"}.
        </p>
      ) : minWordCount ? (
        <p className="mb-1 text-xs">
          Minimum: {minWordCount} word{minWordCount !== 1 && "s"}.
        </p>
      ) : maxWordCount ? (
        <p className="mb-1 text-xs">
          Maximum: {maxWordCount} word{maxWordCount !== 1 && "s"}.
        </p>
      ) : (
        <></>
      )}
      {disabled ? (
        <span className="p-2 min-h-32 h-fit w-full rounded-md border-2 bg-[#f3f4f6] whitespace-pre-wrap">
          {value}
        </span>
      ) : (
        <Textarea
          className={twMerge(
            "p-2 min-h-32 h-fit w-full rounded-md border-2 disabled:opacity-100 disabled:bg-[#f3f4f6] disabled:cursor-not-allowed",
          )}
          required={isRequired}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          placeholder={placeholderText}
        ></Textarea>
      )}
      <p className="text-xs mt-1 font-light">
        {wordCount} word{wordCount !== 1 && "s"}
      </p>
      {errorMessage && <p className="text-red-600">{errorMessage}</p>}
    </main>
  );
};

export default memo(LongFormInput);
