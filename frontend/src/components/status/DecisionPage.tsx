import { ApplicantRole, ReviewStatus } from "@app-portal/shared/constants";
import { useAuth } from "@/hooks/useAuth";
import { useParams } from "react-router-dom";
import { useMyApplicationStatus } from "@/hooks/useApplicationStatus";
import { displayApplicantRoleNameNoEmoji } from "@/utils/display";
import FormMarkdown from "@/components/form/FormMarkdown";
import ErrorPage from "@/pages/ErrorPage";
import NotFoundPage from "@/pages/NotFoundPage";
import { useApplicationFormForResponseId } from "@/hooks/useApplicationForm";
import ConfettiExplosion from "react-confetti-explosion";
import Loading from "@/components/Loading";
import { createDecisionConfirmation } from "@/services/decisionConfirmationService";
import { throwSuccessToast } from "@/components/toasts/SuccessToast";
import { throwErrorToast } from "@/components/toasts/ErrorToast";
import { Button } from "@/components/ui/button";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useDecisionConfirmationForResponse } from "@/hooks/useDecisionConfirmation";
import type { DecisionConfirmation } from "@app-portal/shared/types";

const allowedStatuses: Set<string> = new Set([
  ReviewStatus.Accepted,
  ReviewStatus.Denied,
  ReviewStatus.Waitlisted,
]);

function DecisionPage() {
  const { user, token } = useAuth();
  const { responseId, role } = useParams<{
    responseId: string;
    role: ApplicantRole;
  }>();

  const queryClient = useQueryClient();

  const {
    data: appStatus,
    isPending: statusPending,
    error: statusError,
  } = useMyApplicationStatus(responseId, role);

  const {
    data: form,
    isPending: formPending,
    error: formError,
  } = useApplicationFormForResponseId(responseId);

  const {
    data: decisionConfirmation,
    isPending: decisionPending,
    error: decisionError,
  } = useDecisionConfirmationForResponse(responseId);

  const confirmDecisionMutation = useMutation({
    mutationFn: async (status: "accepted" | "denied") => {
      if (!user || !form || !appStatus || !responseId) {
        throw new Error("Missing required data to confirm decision");
      }

      const decisionConfirmation: DecisionConfirmation = {
        status,
        userId: user?.id,
        formId: form?.id,
        responseId,
        internalStatusId: appStatus.id,
      };

      return createDecisionConfirmation(
        decisionConfirmation,
        (await token()) ?? "",
      );
    },
    onSuccess: (_, status) => {
      throwSuccessToast(
        status === "accepted"
          ? "Decision to join confirmed!"
          : "Decision to not join confirmed.",
      );
      queryClient.invalidateQueries({
        queryKey: ["decision-confirmation", "response", responseId],
      });
    },
    onError: (error) => {
      console.error(error);
      throwErrorToast("Error while registering decision: " + error.message);
    },
  });

  if (!user || !responseId || !role) return <ErrorPage />;

  if (statusPending || formPending || decisionPending) return <Loading />;

  if (statusError || formError || decisionError) return <ErrorPage />;

  if (!appStatus.released || !allowedStatuses.has(appStatus.status)) {
    return <NotFoundPage />;
  }

  const roleKey =
    appStatus.role === ApplicantRole.Bootcamp ? ApplicantRole.Bootcamp : "team";

  const decisionLetterText =
    appStatus.status === ReviewStatus.Accepted ||
    appStatus.status === ReviewStatus.Waitlisted
      ? form?.decisionLetter?.[appStatus.status]?.[roleKey]
      : form?.decisionLetter?.[ReviewStatus.Denied];

  if (!decisionLetterText) {
    return <NotFoundPage />;
  }

  return (
    <>
      <div className="mt-5 mx-auto max-w-5xl w-full px-5 py-5 font-sans leading-relaxed bg-white rounded">
        <div className="flex gap-2 flex-col sm:flex-row items-start justify-between mb-5">
          <div className="flex flex-col">
            <h2 className="text-blue text-2xl">
              Your Hack4Impact-UMD {form.semester}
              <br></br>
              {displayApplicantRoleNameNoEmoji(role as ApplicantRole)}{" "}
              Application
            </h2>
          </div>
        </div>
        <div className="font-[Karla] text-base font-normal leading-tight text-justify [text-justify:inter-word]">
          <p>
            Dear {user.firstName} {user.lastName},
          </p>
          <br></br>
          {appStatus.status === ReviewStatus.Accepted &&
            !decisionConfirmation && (
              <div className="flex items-center justify-center w-full">
                <ConfettiExplosion
                  className="justify-self-center self-start"
                  force={0.8}
                  duration={3000}
                  particleCount={250}
                  width={1600}
                />
              </div>
            )}
          <FormMarkdown className="text-base text-black">
            {decisionLetterText}
          </FormMarkdown>
        </div>
        {form.isActive && appStatus.status === ReviewStatus.Accepted && (
          <div className="flex justify-end mt-10 gap-3">
            {decisionConfirmation ? (
              <p className="text-lg font-semibold">
                {decisionConfirmation.status === "accepted"
                  ? "Offer accepted 🥳"
                  : "Offer declined"}
              </p>
            ) : (
              <>
                <Button
                  onClick={() => confirmDecisionMutation.mutate("accepted")}
                  disabled={confirmDecisionMutation.isPending}
                >
                  Accept your offer to join 🥳
                </Button>
                <Button
                  onClick={() => confirmDecisionMutation.mutate("denied")}
                  disabled={confirmDecisionMutation.isPending}
                  variant={"destructive"}
                >
                  Decline your offer to join
                </Button>
              </>
            )}
          </div>
        )}
      </div>
    </>
  );
}

export default DecisionPage;
