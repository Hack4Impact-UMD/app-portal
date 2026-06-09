import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CheckIcon, TriangleAlertIcon } from "lucide-react";
import { useState } from "react";

import { reviewerRowsQueryRoot } from "@/components/dor/ReviewersDashboard/useRows";
import { throwErrorToast } from "@/components/toasts/ErrorToast";
import { throwSuccessToast } from "@/components/toasts/SuccessToast";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { reviewAssignmentQueries } from "@/hooks/useReviewAssignments";
import type { AutoAssignmentPlanItem } from "@/services/autoAssignmentService";
import {
  calculateBootcampAssignmentPlan,
  makeAssignmentsFromPlan,
} from "@/services/autoAssignmentService";
import type { ReviewCapableUser } from "@/types/types";

import ExemptReviewersDialog from "./ExemptReviewersDialog";
import { underReviewRowsQueryRoot } from "./useRows";

interface AutoAssignButtonProps {
  formId: string;
  disabled?: boolean;
}

export function AutoAssignButton({ formId, disabled }: AutoAssignButtonProps) {
  const [showPreviewDialog, setShowPreviewDialog] = useState(false);
  const [showExemptDialog, setShowExemptDialog] = useState(false);
  const [assignmentPlan, setAssignmentPlan] = useState<
    AutoAssignmentPlanItem[] | null
  >(null);
  const queryClient = useQueryClient();

  const makeAssignmentsMutation = useMutation({
    mutationFn: async ({ plan }: { plan: AutoAssignmentPlanItem[] }) => {
      await makeAssignmentsFromPlan(plan);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: underReviewRowsQueryRoot,
      });
      queryClient.invalidateQueries({
        queryKey: reviewerRowsQueryRoot,
      });
      queryClient.invalidateQueries({
        queryKey: reviewAssignmentQueries.root,
      });
      throwSuccessToast("Assignments successfully created from plan!");
      setShowPreviewDialog(false);
    },
    onError: (err) => {
      throwErrorToast("Failed to make assignments!");
      console.error(err);
    },
  });

  const calculatePlanMutation = useMutation({
    mutationFn: async ({ exempt }: { exempt: ReviewCapableUser[] }) => {
      return await calculateBootcampAssignmentPlan(formId, exempt);
    },
    onSuccess: (plan) => {
      setAssignmentPlan(plan);
      setShowPreviewDialog(true);
      setShowExemptDialog(false);
    },
    onError: (error) => {
      console.error("Failed to create auto-assignment plan:", error);
      throwErrorToast(`Failed to create auto-assignment plan!`);
    },
  });

  return (
    <>
      <Button
        variant="outline"
        onClick={() => setShowExemptDialog(true)}
        disabled={disabled || calculatePlanMutation.isPending}
      >
        {calculatePlanMutation.isPending
          ? "Matching..."
          : "Auto-Assign Bootcamp Applicants"}
      </Button>

      <ExemptReviewersDialog
        open={showExemptDialog}
        onOpenChange={setShowExemptDialog}
        onSubmit={(exempt) => calculatePlanMutation.mutate({ exempt })}
        disabled={calculatePlanMutation.isPending}
      />

      <Dialog open={showPreviewDialog} onOpenChange={setShowPreviewDialog}>
        <DialogContent className="max-w-6xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Auto-Assignment Preview</DialogTitle>
            <DialogDescription>
              Review the proposed assignments below. Click Confirm to apply.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {assignmentPlan && (
              <>
                <div className="text-sm text-muted-foreground">
                  Possible assignments: {assignmentPlan.length} | Assigned:{" "}
                  {assignmentPlan.filter((p) => !p.skipped).length} | Skipped:{" "}
                  {assignmentPlan.filter((p) => p.skipped).length}
                </div>

                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-muted">
                      <tr>
                        <th className="px-4 py-2 text-left">Status</th>
                        <th className="px-4 py-2 text-left">Applicant</th>
                        <th className="px-4 py-2 text-left">Rev. 1</th>
                        <th className="px-4 py-2 text-left">Rev. 2</th>
                      </tr>
                    </thead>
                    <tbody>
                      {assignmentPlan.map((item, idx) => (
                        <tr
                          key={idx}
                          className={item.skipped ? "bg-yellow-50" : ""}
                        >
                          <td className="px-4 py-2 align-top flex items-center justify-center">
                            {item.skipped ? (
                              <TriangleAlertIcon className="text-amber-500 size-5" />
                            ) : (
                              <CheckIcon className="text-green-400 size-5" />
                            )}
                          </td>
                          <td className="px-4 py-2 align-top">
                            {item.applicantName}
                          </td>
                          <td
                            className={`px-4 py-2 align-top ${item.reviewer1 && !item.reviewer1.isExisting ? "bg-green-50" : ""}`}
                          >
                            {item.reviewer1 ? item.reviewer1.name : "-"}
                          </td>
                          <td
                            className={`px-4 py-2 align-top ${item.reviewer2 && !item.reviewer2.isExisting ? "bg-green-50" : ""}`}
                          >
                            {item.reviewer2 ? item.reviewer2.name : "-"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setShowPreviewDialog(false)}
                    disabled={makeAssignmentsMutation.isPending}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={() =>
                      makeAssignmentsMutation.mutate({ plan: assignmentPlan })
                    }
                    disabled={
                      makeAssignmentsMutation.isPending ||
                      assignmentPlan.every((p) => p.skipped)
                    }
                  >
                    Confirm Assignments
                  </Button>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
