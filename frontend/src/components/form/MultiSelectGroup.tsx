import React, { memo, useEffect, useState } from "react";
import { twMerge } from "tailwind-merge";

import FormMarkdown from "./FormMarkdown";
import OptionButton from "./OptionButton";

interface MultiSelectGroupProps {
  question: string;
  isRequired?: boolean;
  label?: string;
  value?: string[];
  options: string[];
  onOptionSelect: (selected: string[]) => void;
  displayName?: (key: string) => string;
  displayColor?: (key: string) => string;
  displayDarkColor?: (key: string) => string;
  className?: string;
  disabled?: boolean;
  errorMessage?: string;
}

const MultiSelectGroup: React.FC<MultiSelectGroupProps> = ({
  question,
  isRequired,
  label,
  value,
  options,
  onOptionSelect,
  className = "",
  disabled,
  errorMessage,
  displayName = (k) => k,
  displayDarkColor = () => undefined,
  displayColor = () => undefined,
}) => {
  const [selectedOptions, setSelectedOptions] = useState<string[]>(value || []);

  useEffect(() => {
    setSelectedOptions(value || []);
  }, [value]);

  const handleSelectClick = (optionName: string) => {
    //NOTE: filtering by name isn't ideal, there might end up being a case
    //where duplicate names are needed. Better to assign an id (index would suffice)
    const updatedSelections = selectedOptions.includes(optionName)
      ? selectedOptions.filter((option) => option !== optionName)
      : [...selectedOptions, optionName];
    setSelectedOptions(updatedSelections);
    onOptionSelect(updatedSelections);
  };

  return (
    <main className={twMerge("flex flex-col min-w-60", className)}>
      <span className="text-xl font-normal mb-2">
        {question}
        {isRequired && <span className="text-red-600 ml-px">*</span>}
        {!isRequired && <span className="font-light text-xs"> (Optional)</span>}
      </span>

      <FormMarkdown>{label}</FormMarkdown>

      <div className="flex flex-wrap gap-1 mt-2">
        {options.map((option) => (
          <OptionButton
            key={option}
            optionName={displayName(option)}
            optionColor={displayColor(option)}
            optionDarkColor={displayDarkColor(option)}
            buttonType="multiSelect"
            isSelected={selectedOptions.includes(option)}
            onClick={() => handleSelectClick(option)}
            disabled={disabled}
          />
        ))}
      </div>
      {errorMessage && <p className="text-red-600">{errorMessage}</p>}
    </main>
  );
};

export default memo(MultiSelectGroup);
