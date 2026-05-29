import React, { memo } from "react";
import { twMerge } from "tailwind-merge";

import { Input } from "@/components/ui/input";

import FormMarkdown from "./FormMarkdown";

interface OneLineInputProps {
  question: string;
  label?: string;
  isRequired?: boolean;
  value: string;
  onChange: (value: string) => void;
  className?: string;
  minWords?: number;
  maxWords?: number;
  disabled?: boolean;
  errorMessage?: string;
  placeholderText?: string;
}

const OneLineInput: React.FC<OneLineInputProps> = ({
  question,
  label,
  isRequired,
  value,
  onChange,
  className = "",
  disabled,
  errorMessage,
  placeholderText = "",
}) => {
  return (
    <main
      className={twMerge(
        "flex flex-col hover:brightness-95 transition",
        className,
      )}
    >
      <span className="mb-2 text-xl font-normal">
        {question}
        {isRequired && <span className="text-red-600 ml-px">*</span>}
        {!isRequired && <span className="font-light text-xs"> (Optional)</span>}
      </span>

      <FormMarkdown>{label}</FormMarkdown>

      <Input
        className={twMerge(
          "max-w-96 mt-auto p-2 w-full bg-white rounded-md outline outline-black border-2 disabled:cursor-not-allowed disabled:opacity-100 disabled:bg-[#f3f4f6]",
        )}
        required={isRequired}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        placeholder={placeholderText || "Enter your response..."}
      ></Input>

      {errorMessage && <p className="text-red-600">{errorMessage}</p>}
    </main>
  );
};

export default memo(OneLineInput);
