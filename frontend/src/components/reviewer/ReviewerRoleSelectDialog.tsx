import { ApplicantRole } from "@app-portal/shared/constants";
import { useMemo, useState } from "react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useAuth } from "@/hooks/useAuth";
import { displayApplicantRoleNameNoEmoji } from "@/utils/display";

type ReviewerRoleSelectDialogProps = {
  open: boolean;
  onSubmit: (prefs: ApplicantRole[]) => void;
  minRoles: number;
};

export default function ReviewerRoleSelectDialog({
  open,
  onSubmit,
  minRoles,
}: ReviewerRoleSelectDialogProps) {
  const { user } = useAuth();
  const [selectedRoles, setSelectedRoles] = useState([ApplicantRole.Bootcamp]);

  const isValid = useMemo(
    () =>
      selectedRoles.includes(ApplicantRole.Bootcamp) &&
      selectedRoles.length >= minRoles,
    [selectedRoles, minRoles],
  );

  if (!user) return <p>Failed to fetch user!</p>;

  return (
    <AlertDialog open={open}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            Hello {user.firstName}, it's time to select your reviewer role
            preferences
          </AlertDialogTitle>
          <AlertDialogDescription>
            You've been assigned to be a reviewer, but haven't selected the
            roles you wish to review applications for yet. This is necessary
            before you can start reviewing applications.{" "}
            <span className="font-bold">
              All reviewers must review Bootcamp applications. Select at least{" "}
              {minRoles} roles!{" "}
            </span>
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="w-full overflow-x-scroll">
          <ToggleGroup
            variant="outline"
            type="multiple"
            defaultValue={selectedRoles}
            value={selectedRoles}
            onValueChange={(v) => setSelectedRoles(v as ApplicantRole[])}
          >
            {Object.entries(ApplicantRole).map((e) => (
              <ToggleGroupItem
                key={e[1]}
                value={e[1]}
                size={"lg"}
                className="data-[state=on]:bg-blue data-[state=on]:text-white cursor-pointer w-48"
              >
                <p className="overflow-x-hidden w-full">
                  {displayApplicantRoleNameNoEmoji(e[1])}
                </p>
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </div>
        <AlertDialogFooter>
          <AlertDialogAction
            onClick={() => onSubmit(selectedRoles)}
            disabled={!isValid}
          >
            Submit Preferences
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
