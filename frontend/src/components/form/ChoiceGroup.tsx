import React, { memo, useState } from "react";
import { twMerge } from "tailwind-merge";

import FormMarkdown from "./FormMarkdown";
import OptionButton from "./OptionButton";

interface ChoiceGroupProps {
  question: string;
  isRequired?: boolean;
  label?: string;
  value: string;
  options: string[];
  errorMessage?: string;
  onOptionSelect: (selected: string | null) => void;
  className?: string;
  disabled?: boolean;
}
const ChoiceGroup: React.FC<ChoiceGroupProps> = ({
  question,
  isRequired,
  label,
  value,
  options,
  onOptionSelect,
  className = "",
  disabled,
  errorMessage,
}) => {
  const [selectedOption, setSelectedOption] = useState<string | null>(value);

  const handleSelectClick = (optionName: string) => {
    setSelectedOption(optionName);
    onOptionSelect(optionName);
  };

  return (
    <main className={twMerge("flex flex-col min-w-52", className)}>
      <span className="text-xl font-normal">
        {question}
        {isRequired && <span className="text-red-600 ml-px">*</span>}
        {!isRequired && <span className="font-light text-xs"> (Optional)</span>}
      </span>
      <FormMarkdown>{label}</FormMarkdown>
      <div>
        {options.map((option) => (
          <OptionButton
            key={option}
            optionName={option}
            buttonType="choice"
            isSelected={selectedOption === option}
            onClick={() => handleSelectClick(option)}
            disabled={disabled}
          />
        ))}
      </div>
      {errorMessage && <p className="text-red-600">{errorMessage}</p>}
    </main>
  );
};

export default memo(ChoiceGroup);
