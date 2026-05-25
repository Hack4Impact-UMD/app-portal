import { PermissionRole } from "@app-portal/shared/constants";
import type { ApplicantRole } from "@app-portal/shared/constants";
import type { ApplicationReviewData } from "@app-portal/shared/types";
import { CheckIcon, CircleAlertIcon, UserCheckIcon } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import Section from "@/components/form/Section";
import Loading from "@/components/Loading";
import RoleRubric from "@/components/reviewer/rubric/RoleRubric";
import Spinner from "@/components/Spinner";
import { throwErrorToast } from "@/components/toasts/ErrorToast";
import { throwSuccessToast } from "@/components/toasts/SuccessToast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useApplicant } from "@/hooks/useApplicants";
import { useApplicationForm } from "@/hooks/useApplicationForm";
import { useApplicationResponse } from "@/hooks/useApplicationResponses";
import { useAuth } from "@/hooks/useAuth";
import { useReviewData, useUpdateReviewData } from "@/hooks/useReviewData";
import { useRubricsForFormRole } from "@/hooks/useRubrics";
import { useUser } from "@/hooks/useUsers";
import type { ApplicationForm } from "@/types/types";
import { displayApplicantRoleNameNoEmoji } from "@/utils/display";
import { calculateReviewScore } from "@/utils/scores";

type UserHeaderProps = {
  applicantId: string;
  form: ApplicationForm;
  role: ApplicantRole;
  lastSave?: number;
  reviewData: ApplicationReviewData;
};

function UserHeader({
  applicantId,
  form,
  role,
  lastSave,
  reviewData,
}: UserHeaderProps) {
  const { data: applicant, isPending, error } = useApplicant(applicantId);
  const { user } = useAuth();
  const {
    data: reviewer,
    isPending: reviewerPending,
    error: reviewerError,
  } = useUser(reviewData.reviewerId);

  if (isPending)
    return (
      <div className="w-full flex flex-row items-center justify-center p-2">
        <Spinner />
      </div>
    );

  if (error)
    return (
      <div className="w-full bg-red-200 rounded p-2">
        <p className="text-destructive font-bold">
          Failed to fetch user: {error.message}
        </p>
      </div>
    );

  return (
    <div className="w-full flex flex-col gap-0">
      <h1 className="text-xl">
        {applicant.firstName} {applicant.lastName}'s {form.semester}{" "}
        {displayApplicantRoleNameNoEmoji(role)} Application
      </h1>
      <div className="items-center flex flex-row gap-2">
        {applicant.isInternal && (
          <div className="flex bg-blue text-blue-100 font-bold text-sm flex-row gap-1 rounded-full py-0 px-2 border border-blue items-center">
            <UserCheckIcon className="size-4" />
            <span>INTERNAL</span>
          </div>
        )}
        <span>
          {reviewData.submitted ? (
            <span>
              <CheckIcon className="inline size-5" /> Submitted{" "}
              {user?.role === PermissionRole.SuperReviewer ? (
                reviewerPending ? (
                  <p>by ...</p>
                ) : reviewerError ? (
                  <p>by (failed to load reviewer) </p>
                ) : (
                  <>
                    by{" "}
                    <strong>
                      {reviewer.firstName} {reviewer.lastName}
                    </strong>
                  </>
                )
              ) : (
                <></>
              )}
            </span>
          ) : lastSave ? (
            `Last saved ${new Date(lastSave).toLocaleTimeString()}`
          ) : (
            `Not saved`
          )}
        </span>
      </div>
    </div>
  );
}

const AppReviewPage: React.FC = () => {
  const navigate = useNavigate();
  const { formId, responseId, reviewDataId } = useParams<{
    formId: string;
    reviewDataId: string;
    responseId: string;
  }>();

  const {
    data: response,
    isPending: responseLoading,
    error: responseError,
  } = useApplicationResponse(responseId);

  const {
    data: form,
    isPending: formLoading,
    error: formError,
  } = useApplicationForm(formId);

  const {
    data: reviewData,
    isPending: reviewPending,
    error: reviewError,
  } = useReviewData(reviewDataId ?? "");

  const { mutate: updateReviewData, submittedAt: lastSave } =
    useUpdateReviewData(reviewDataId ?? "");
  const { mutate: submitReview, isPending: isSubmitting } = useUpdateReviewData(
    reviewDataId ?? "",
  );

  const {
    data: rubrics,
    isPending: rubricsPending,
    error: rubricsError,
  } = useRubricsForFormRole(form?.id, reviewData?.forRole);

  const score = useMemo(
    () =>
      reviewData && form ? calculateReviewScore(reviewData, form) : undefined,
    [reviewData, form],
  );

  const [localNotes, setLocalNotes] = useState<
    Record<string, string> | undefined
  >(undefined);

  const [isCommandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const sectionRefs = useRef<Map<string, HTMLDivElement | null>>(new Map());

  useEffect(() => {
    if (reviewData && !localNotes) {
      setLocalNotes(reviewData.reviewerNotes || {});
    }
  }, [reviewData, localNotes]);

  useEffect(() => {
    if (localNotes === undefined || !reviewData || reviewData.submitted) return;
    const ref = setTimeout(() => {
      updateReviewData(
        { reviewerNotes: localNotes },
        {
          onError: (err) => {
            console.log("Autosave failed:", err);
            throwErrorToast("Failed to autosave notes!");
          },
        },
      );
    }, 1000);
    return () => clearTimeout(ref);
  }, [localNotes, reviewData, updateReviewData]);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setCommandPaletteOpen((open) => !open);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const optimisticReviewData = useMemo(() => {
    if (!reviewData) return undefined;
    if (!localNotes) return reviewData;
    return {
      ...reviewData,
      reviewerNotes: localNotes,
    };
  }, [reviewData, localNotes]);

  const sortedRubrics = useMemo(
    () =>
      rubrics
        ? [...rubrics].sort((a, b) => a.roles.length - b.roles.length)
        : [],
    [rubrics],
  );

  const scoreChange = useCallback(
    (key: string, value: number) => {
      if (!reviewData || reviewData.submitted) return;

      const newScores = {
        ...reviewData.applicantScores,
        [key]: value,
      };

      updateReviewData({ applicantScores: newScores });
    },
    [reviewData, updateReviewData],
  );

  const commentChange = useCallback((id: string, value: string) => {
    setLocalNotes((prev) => ({ ...(prev ?? {}), [id]: value }));
  }, []);

  const handleSubmitReview = () => {
    const requiredKeys =
      rubrics?.flatMap((r) => r.rubricQuestions.map((q) => q.scoreKey)) ?? [];
    const existingKeys = new Set(
      Object.keys(reviewData?.applicantScores ?? {}),
    );

    for (const req of requiredKeys) {
      if (!existingKeys.has(req)) {
        throwErrorToast(`Review is incomplete, missing required key ${req}`);
        return;
      }
    }

    submitReview(
      {
        ...optimisticReviewData,
        reviewerNotes: localNotes,
        submitted: true,
      },
      {
        onSuccess: () => {
          throwSuccessToast("Review submitted successfully!");
          navigate(-1);
        },
        onError: () => {
          throwErrorToast("Failed to submit review");
        },
      },
    );
  };

  const handleJumpToSection = (sectionId: string) => {
    sectionRefs.current.get(sectionId)?.scrollIntoView({ behavior: "smooth" });
    setCommandPaletteOpen(false);
  };

  const visibleSections = useMemo(
    () =>
      form?.sections.filter((s) => {
        if (s.hideFromReviewers) return false;
        if (s.forRoles && s.forRoles.length > 0) {
          return s.forRoles.some((r) => response?.rolesApplied?.includes(r));
        } else {
          return true;
        }
      }) ?? [],
    [form?.sections, response?.rolesApplied],
  );

  const renderedForm = useMemo(
    () =>
      response &&
      form &&
      visibleSections.map((s) => (
        <div
          ref={(el) => {
            sectionRefs.current.set(s.sectionId, el);
          }}
          className="shadow border border-gray-200 bg-white rounded-md p-4"
          key={s.sectionId}
        >
          <Section
            responseId={response.id}
            key={s.sectionId}
            disabled={true}
            section={s}
            responses={
              response.sectionResponses.find((r) => r.sectionId === s.sectionId)
                ?.questions ?? []
            }
            onChangeResponse={() => {}}
            disabledRoles={form.disabledRoles ?? []}
          />
        </div>
      )),
    [form, response, visibleSections],
  );

  const header = useMemo(
    () =>
      reviewData &&
      response &&
      form && (
        <UserHeader
          reviewData={reviewData}
          applicantId={response.userId}
          form={form}
          role={reviewData.forRole}
          lastSave={lastSave}
        />
      ),
    [form, lastSave, response, reviewData],
  );

  if (
    formLoading ||
    responseLoading ||
    reviewPending ||
    rubricsPending ||
    !localNotes
  )
    return <Loading />;
  if (formError || !form)
    return <p>Failed to fetch form: {formError.message}</p>;
  if (responseError || !response)
    return <p>Failed to fetch response: {responseError?.message}</p>;
  if (reviewError) return <p>Failed to fetch review: {reviewError.message}</p>;
  if (rubricsError)
    return <p>Failed to fetch rubrics: {rubricsError.message}</p>;
  if (!optimisticReviewData) return <p>Failed to fetch review data</p>;

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] px-8">
      <CommandDialog
        open={isCommandPaletteOpen}
        onOpenChange={setCommandPaletteOpen}
      >
        <CommandInput placeholder="Jump to section..." />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          <CommandGroup heading="Sections">
            {visibleSections.map((s) => (
              <CommandItem
                key={s.sectionId}
                onSelect={() => handleJumpToSection(s.sectionId)}
              >
                {s.sectionName}
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </CommandDialog>
      <div className="flex flex-row w-full py-2 px-4 items-center rounded border border-blue-300 bg-blue-100 text-blue">
        {header}
        {score === undefined ? (
          `Failed to calculate score!`
        ) : (
          <span className="text-lg text-blue w-64 mr-2">
            Review Score:{" "}
            {typeof score === "number" && score >= 0 ? (
              <>
                <span className="font-bold">{score.toFixed(2) ?? "N/A"}</span> /
                4
              </>
            ) : (
              <Tooltip>
                <TooltipTrigger asChild>
                  <CircleAlertIcon className="inline" />
                </TooltipTrigger>
                <TooltipContent>Score is undefined!</TooltipContent>
              </Tooltip>
            )}
          </span>
        )}
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="default"
              disabled={isSubmitting || optimisticReviewData.submitted}
            >
              {isSubmitting ? (
                "Submitting..."
              ) : optimisticReviewData.submitted ? (
                <span>
                  <CheckIcon className="inline" /> Submitted
                </span>
              ) : (
                "Submit Review"
              )}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                Are you sure you want to submit this review?
              </AlertDialogTitle>
              <AlertDialogDescription>
                You will not be able to edit it after submission.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleSubmitReview}>
                Confirm
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
      <ResizablePanelGroup
        direction="horizontal"
        className="flex gap-2 justify-center grow overflow-scroll pt-2"
      >
        <ResizablePanel defaultSize={50}>
          <div className="w-full flex h-full flex-col gap-2 overflow-scroll rounded-md">
            <div className="shadow border border-gray-200 bg-white rounded-md p-4">
              <p className="text-muted-foreground text-sm">
                Press{" "}
                <kbd className="bg-muted text-muted-foreground pointer-events-none inline-flex h-5 items-center gap-1 rounded border px-1.5 font-mono text-[10px] font-medium opacity-100 select-none">
                  <span className="text-xs">⌘</span>K
                </kbd>{" "}
                to jump to a section
              </p>
            </div>
            {renderedForm}
          </div>
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel defaultSize={50}>
          <div className="w-full overflow-y-scroll flex flex-col gap-2 h-full rounded-md">
            {sortedRubrics.map((r) => (
              <RoleRubric
                role={reviewData.forRole}
                key={r.id}
                rubric={r}
                onScoreChange={scoreChange}
                onCommentChange={commentChange}
                reviewData={optimisticReviewData}
                disabled={optimisticReviewData.submitted}
                form={form}
              />
            ))}
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
};

export default AppReviewPage;
