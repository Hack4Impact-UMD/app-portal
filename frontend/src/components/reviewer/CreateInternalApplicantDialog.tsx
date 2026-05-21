import { ApplicantRole } from "@app-portal/shared/types";
import { Button } from "../ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "../ui/dialog";
import { Input } from "../ui/input";
import { useCallback, useEffect, useMemo, useState } from "react";

import { displayApplicantRoleName } from "@/utils/display";
import { ToggleGroup, ToggleGroupItem } from "../ui/toggle-group";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createInternalApplicant } from "@/services/userService";
import { useActiveForm } from "@/hooks/useApplicationForm";
import { generateSectionResponses } from "@/utils/dummy-response";
import { useAuth } from "@/hooks/useAuth";
import { throwSuccessToast } from "@/components/toasts/SuccessToast";
import { throwErrorToast } from "@/components/toasts/ErrorToast";

export default function CreateInternalApplicantDialog() {
  const [open, setOpen] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [rolesApplied, setRolesApplied] = useState<ApplicantRole[]>([]);

  const queryClient = useQueryClient();

  const {
    data: appForm,
    isPending: isLoadingForm,
    error: formError,
  } = useActiveForm();

  const { token } = useAuth();

  const reset = useCallback(() => {
    setFirstName("");
    setLastName("");
    setRolesApplied([]);
  }, []);

  useEffect(() => {
    if (!open) reset();
  }, [open, reset]);

  const isValid = useMemo(
    () =>
      firstName.trim() !== "" &&
      lastName.trim() !== "" &&
      rolesApplied.length > 0 &&
      !!appForm,
    [firstName, lastName, rolesApplied, appForm],
  );

  const submitMutation = useMutation({
    mutationFn: async () => {
      if (!isValid || !appForm) {
        throw new Error("Invalid input or form!");
      }

      if (!token) {
        throw new Error("User must be authenticated!");
      }

      const tok = await token();
      if (!tok) {
        throw new Error("Failed to get authentication token!");
      }

      const sectionResponses = generateSectionResponses(
        appForm.sections,
        rolesApplied,
        appForm.id,
      );

      return createInternalApplicant(
        firstName,
        lastName,
        appForm.id,
        rolesApplied,
        sectionResponses,
        tok,
      );
    },
    onSuccess: (data) => {
      throwSuccessToast(
        `Created user ${data.user.firstName} ${data.user.lastName} with Qualified status!`,
      );

      // backend route creates new user, response, and status objects
      queryClient.invalidateQueries({ queryKey: ["users"] });
      queryClient.invalidateQueries({
        queryKey: ["responses", "form", appForm!.id],
      });
      queryClient.invalidateQueries({
        queryKey: ["status", data.applicationResponse.id],
      });
      queryClient.invalidateQueries({ queryKey: ["qualified-apps-rows"] });
      queryClient.invalidateQueries({ queryKey: ["all-apps-rows"] });

      setOpen(false);
    },
    onError: (error) => {
      throwErrorToast(`Failed to create internal applicant: ${error}`);
    },
  });

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!isValid) return;
    submitMutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-blue hover:bg-blue/90 text-white">
          Create Internal Applicant
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create an Internal Applicant</DialogTitle>
          <DialogDescription>
            Enter the details of the internal applicant below. A dummy applicant
            and response will be created and viewable as a typical applicant.
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-4 max-w-full overflow-x-hidden"
        >
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <label htmlFor="firstName" className="text-sm font-medium">
                First Name
              </label>
              <Input
                id="firstName"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Enter first name"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="lastName" className="text-sm font-medium">
                Last Name
              </label>
              <Input
                id="lastName"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Enter last name"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">Application Form</label>
              <div className="px-3 py-2 border rounded-md bg-muted/50 text-sm">
                {isLoadingForm ? (
                  <p>Loading...</p>
                ) : formError ? (
                  <p className="text-destructive">Error loading form</p>
                ) : appForm ? (
                  <p>{appForm.id}</p>
                ) : (
                  <p className="text-destructive">No active form available</p>
                )}
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">
                Roles Applied (select at least one!)
              </label>
              <div className="overflow-x-scroll">
                <ToggleGroup
                  variant="outline"
                  type="multiple"
                  defaultValue={rolesApplied}
                  value={rolesApplied}
                  onValueChange={(v) => setRolesApplied(v as ApplicantRole[])}
                >
                  {Object.values(ApplicantRole)
                    .filter((value) => value !== ApplicantRole.Bootcamp)
                    .map((role) => (
                      <ToggleGroupItem
                        key={role}
                        value={role}
                        size={"lg"}
                        className="data-[state=on]:bg-blue data-[state=on]:text-white cursor-pointer w-48"
                      >
                        <p className="overflow-x-hidden w-full">
                          {displayApplicantRoleName(role)}
                        </p>
                      </ToggleGroupItem>
                    ))}
                </ToggleGroup>
              </div>
            </div>
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button
                type="button"
                variant="outline"
                disabled={submitMutation.isPending}
              >
                Cancel
              </Button>
            </DialogClose>
            <Button
              type="submit"
              disabled={!isValid || submitMutation.isPending}
            >
              {submitMutation.isPending ? "Creating..." : "Submit"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
