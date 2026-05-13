import { useNavigate, useParams } from "react-router-dom";
import Section from "@/components/form/Section";
import { useApplicationForm } from "@/hooks/useApplicationForm";
import Loading from "@/components/Loading";
import { useApplicationResponse } from "@/hooks/useApplicationResponses";
import Spinner from "@/components/Spinner";
import { useApplicant } from "@/hooks/useApplicants";
import { ApplicantRole, ApplicationForm } from "@/types/formBuilderTypes";
import { displayApplicantRoleName } from "@/utils/display";
import { Button } from "@/components/ui/button";
import RoleRubric from "@/components/reviewer/rubric/RoleRubric";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { throwErrorToast } from "@/components/toasts/ErrorToast";
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
import { throwSuccessToast } from "@/components/toasts/SuccessToast";
import {
  useInterviewData,
  useUpdateInterviewData,
} from "@/hooks/useInterviewData";
import { useInterviewRubricsForFormRole } from "@/hooks/useInterviewRubrics";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { CheckIcon, CircleAlertIcon, UserCheckIcon } from "lucide-react";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { ApplicationInterviewData, PermissionRole } from "@/types/types";
import { useAuth } from "@/hooks/useAuth";
import { useUser } from "@/hooks/useUsers";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { calculateInterviewScore } from "@/utils/scores";

type UserHeaderProps = {
  applicantId: string;
  form: ApplicationForm;
  role: ApplicantRole;
  interviewData: ApplicationInterviewData;
  lastSave?: number;
};

function UserHeader({
  applicantId,
  form,
  role,
  interviewData,
  lastSave,
}: UserHeaderProps) {
  const { data: applicant, isPending, error } = useApplicant(applicantId);
  const { user } = useAuth();
  const {
    data: reviewer,
    isPending: reviewerPending,
    error: reviewerError,
  } = useUser(interviewData.interviewerId);

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
    <div className="w-full flex flex-col gap-1">
      <h1 className="text-xl">
        {applicant.firstName} {applicant.lastName}'s {form.semester}{" "}
        {displayApplicantRoleName(role)} Interview
      </h1>
      <div className="items-center flex flex-row gap-2">
        {applicant.isInternal && (
          <div className="flex bg-blue text-blue-100 font-bold text-sm flex-row gap-1 rounded-full py-0 px-2 border border-blue items-center">
            <UserCheckIcon className="size-4" />
            <span>INTERNAL</span>
          </div>
        )}
        <span>
          {interviewData.submitted ? (
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

const InterviewPage: React.FC = () => {
  const navigate = useNavigate();
  const { formId, responseId, interviewDataId } = useParams<{
    formId: string;
    interviewDataId: string;
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
    data: interviewData,
    isPending: interviewPending,
    error: interviewError,
  } = useInterviewData(interviewDataId ?? "");

  const sectionRefs = useRef<Map<string, HTMLDivElement | null>>(new Map());
  const [isCommandPaletteOpen, setCommandPaletteOpen] = useState(false);

  const { mutate: updateInterviewData, submittedAt: lastSave } =
    useUpdateInterviewData(interviewDataId ?? "");
  const { mutate: submitInterview, isPending: isSubmitting } =
    useUpdateInterviewData(interviewDataId ?? "");

  const {
    data: interviewRubrics,
    isPending: interviewRubricsPending,
    error: interviewRubricsError,
  } = useInterviewRubricsForFormRole(form?.id, interviewData?.forRole);

  const interviewScore = useMemo(
    () =>
      form && interviewData
        ? calculateInterviewScore(interviewData, form)
        : undefined,
    [form, interviewData],
  );

  const [localNotes, setLocalNotes] = useState<
    Record<string, string> | undefined
  >(undefined);

  useEffect(() => {
    if (interviewData && !localNotes) {
      setLocalNotes(interviewData.interviewerNotes || {});
    }
  }, [interviewData, localNotes]);

  useEffect(() => {
    if (localNotes === undefined || !interviewData || interviewData.submitted)
      return;
    const ref = setTimeout(() => {
      updateInterviewData({ interviewerNotes: localNotes });
    }, 1000);
    return () => clearTimeout(ref);
  }, [localNotes, interviewData, updateInterviewData]);

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

  const optimisticInterviewData = useMemo(() => {
    if (!interviewData) return undefined;
    if (!localNotes) return interviewData;
    return {
      ...interviewData,
      interviewerNotes: localNotes,
    };
  }, [interviewData, localNotes]);

  const sortedInterviewRubrics = useMemo(
    () =>
      interviewRubrics
        ? [...interviewRubrics].sort((a, b) => a.roles.length - b.roles.length)
        : [],
    [interviewRubrics],
  );

  const interviewScoreChange = useCallback(
    (key: string, value: number) => {
      if (!interviewData || interviewData.submitted) return;

      const newScores = {
        ...interviewData.interviewScores,
        [key]: value,
      };

      updateInterviewData({ interviewScores: newScores });
    },
    [interviewData, updateInterviewData],
  );

  const commentChange = useCallback((id: string, value: string) => {
    setLocalNotes((prev) => ({ ...(prev ?? {}), [id]: value }));
  }, []);

  const handleSubmitInterview = () => {
    const requiredKeys =
      interviewRubrics?.flatMap((r) =>
        r.rubricQuestions.map((q) => q.scoreKey),
      ) ?? [];
    const existingKeys = new Set(
      Object.keys(interviewData?.interviewScores ?? {}),
    );

    for (const req of requiredKeys) {
      if (!existingKeys.has(req)) {
        throwErrorToast(`Interview is incomplete, missing required key ${req}`);
        return;
      }
    }

    submitInterview(
      {
        ...optimisticInterviewData,
        interviewerNotes: localNotes,
        submitted: true,
      },
      {
        onSuccess: () => {
          throwSuccessToast("Interview submitted successfully!");
          navigate(-1);
        },
        onError: () => {
          throwErrorToast("Failed to submit interview");
        },
      },
    );
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

  const handleJumpToSection = (sectionId: string) => {
    sectionRefs.current.get(sectionId)?.scrollIntoView({ behavior: "smooth" });
    setCommandPaletteOpen(false);
  };

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
      interviewData &&
      response &&
      form && (
        <UserHeader
          interviewData={interviewData}
          applicantId={response.userId}
          form={form}
          role={interviewData.forRole}
          lastSave={lastSave}
        />
      ),
    [form, lastSave, response, interviewData],
  );

  if (
    formLoading ||
    responseLoading ||
    interviewPending ||
    interviewRubricsPending ||
    !localNotes
  )
    return <Loading />;
  if (formError || !form)
    return <p>Failed to fetch form: {formError.message}</p>;
  if (responseError || !response)
    return <p>Failed to fetch response: {responseError?.message}</p>;
  if (interviewError)
    return <p>Failed to fetch interview: {interviewError.message}</p>;
  if (interviewRubricsError)
    return <p>Failed to fetch rubrics: {interviewRubricsError.message}</p>;
  if (!optimisticInterviewData) return <p>Failed to fetch interview data</p>;

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

        {interviewScore === undefined ? (
          `Failed to calculate score!`
        ) : (
          <span className="text-lg text-blue w-72 mr-2">
            Interview Score:{" "}
            {typeof interviewScore === "number" && interviewScore >= 0 ? (
              <>
                <span className="font-bold">
                  {interviewScore.toFixed(2) ?? "N/A"}
                </span>{" "}
                / 4
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
              disabled={isSubmitting || optimisticInterviewData.submitted}
            >
              {isSubmitting
                ? "Submitting..."
                : optimisticInterviewData.submitted
                  ? "Submitted"
                  : "Submit Interview"}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                Are you sure you want to submit this interview?
              </AlertDialogTitle>
              <AlertDialogDescription>
                You will not be able to edit it after submission.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleSubmitInterview}>
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
            {sortedInterviewRubrics.length === 0 ? (
              <div className="w-full h-full flex items-center justify-center">
                <p className="text-center">
                  No interview rubrics found for this role
                </p>
              </div>
            ) : (
              sortedInterviewRubrics.map((r) => (
                <RoleRubric
                  role={interviewData.forRole}
                  key={r.id}
                  rubric={r}
                  onScoreChange={interviewScoreChange}
                  onCommentChange={commentChange}
                  interviewData={optimisticInterviewData}
                  disabled={optimisticInterviewData.submitted}
                  form={form}
                />
              ))
            )}
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
};

export default InterviewPage;
