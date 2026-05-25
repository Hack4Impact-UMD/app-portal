import type { ReviewStatus } from "@app-portal/shared/constants";
import { ApplicantRole, PermissionRole } from "@app-portal/shared/constants";

export function displayUserRoleName(role: PermissionRole) {
  if (role === PermissionRole.SuperReviewer) return "Super Reviewer";
  else if (role === PermissionRole.Board) return "Board Member";
  else if (role === PermissionRole.Applicant) return "Applicant";
  else return "Reviewer";
}

export function displayReviewStatus(status: ReviewStatus | "all") {
  return status.charAt(0).toUpperCase() + status.slice(1).replace(/-/g, " ");
}

export function displayApplicantRoleName(
  role: ApplicantRole,
  maxLength?: number,
) {
  let name: string;

  if (role === ApplicantRole.Bootcamp) name = "🥾 Bootcamp";
  else if (role === ApplicantRole.TechLead) name = "🤖 Tech Lead";
  else if (role === ApplicantRole.Product) name = "🤝 Product Manager";
  else if (role === ApplicantRole.SocialMedia) name = "📱 Social Media Manager";
  else if (role === ApplicantRole.OutreachCoord)
    name = "📢 Outreach Coordinator";
  else if (role === ApplicantRole.Engineer) name = "⚙️ Engineer";
  else if (role === ApplicantRole.Designer) name = "🎨 Designer";
  else name = role;

  // end with ... to fix styling when names are too long
  if (maxLength && name.length > maxLength) {
    return name.slice(0, maxLength - 3) + "...";
  }

  return name;
}

export function displayApplicantRoleNameNoEmoji(role: ApplicantRole) {
  if (role === ApplicantRole.Bootcamp) return "Bootcamp";
  else if (role === ApplicantRole.TechLead) return "Tech Lead";
  else if (role === ApplicantRole.Product) return "Product Manager";
  else if (role === ApplicantRole.SocialMedia) return "Social Media Manager";
  else if (role === ApplicantRole.OutreachCoord) return "Outreach Coordinator";
  else if (role === ApplicantRole.Engineer) return "Engineer";
  else if (role === ApplicantRole.Designer) return "Designer";
  else return role;
}

export function applicantRoleColor(role: ApplicantRole) {
  if (role === ApplicantRole.Bootcamp) return "#FBDED9";
  else if (role === ApplicantRole.TechLead) return "#E2D8E8";
  else if (role === ApplicantRole.Product) return "#DCEBDD";
  else if (role === ApplicantRole.SocialMedia) return "#F8E6BA";
  else if (role === ApplicantRole.OutreachCoord) return "#FEF9C3";
  else if (role === ApplicantRole.Engineer) return "#D5E7F2";
  else if (role === ApplicantRole.Designer) return "#F8DFEB";
  else return "#FFFFFF";
}

export function applicantRoleDarkColor(role: ApplicantRole) {
  if (role === ApplicantRole.Bootcamp) return "#5D1615";
  else if (role === ApplicantRole.TechLead) return "#592878";
  else if (role === ApplicantRole.Product) return "#1D3829";
  else if (role === ApplicantRole.SocialMedia) return "#402C1B";
  else if (role === ApplicantRole.OutreachCoord) return "#713F12";
  else if (role === ApplicantRole.Engineer) return "#193347";
  else if (role === ApplicantRole.Designer) return "#4C2337";
  else return "#000000";
}
