import type { ApplicantRole } from "@app-portal/shared/constants";
import { twMerge } from "tailwind-merge";

import {
  applicantRoleColor,
  applicantRoleDarkColor,
  displayApplicantRoleName,
} from "@/utils/display";

type ApplicantRolePillProps = {
  role: ApplicantRole;
  maxLength?: number;
  className?: string;
};

export default function ApplicantRolePill({
  role,
  maxLength,
  className = "",
}: ApplicantRolePillProps) {
  return (
    <span
      style={{
        backgroundColor: applicantRoleColor(role),
        color: applicantRoleDarkColor(role),
      }}
      className={twMerge(
        `text-sm rounded-full px-2 py-1 text-center flex items-center max-w-fit justify-center`,
        className,
      )}
    >
      {displayApplicantRoleName(role, maxLength)}
    </span>
  );
}
