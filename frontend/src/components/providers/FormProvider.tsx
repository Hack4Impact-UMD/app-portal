import type { ApplicantRole } from "@app-portal/shared/constants";
import type { QuestionResponse } from "@app-portal/shared/types";
import { ApplicationStatus, QuestionType } from "@app-portal/shared/constants";
import { Navigate, Outlet, useParams } from "react-router-dom";
import { FormContext } from "../../contexts/formContext";
import { useMyApplicationResponseAndForm } from "../../hooks/useApplicationResponses";
import Loading from "../Loading";
import { useEffect, useMemo, useState, useCallback } from "react";
import type { ApplicationResponse } from "../../types/types";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { saveApplicationResponse } from "../../services/applicationResponsesService";
import { useAuth } from "../../hooks/useAuth";
import { Timestamp } from "firebase/firestore";
import { throwErrorToast } from "../toasts/ErrorToast";
import { Button } from "../ui/button";
import Spinner from "../Spinner";

export default function FormProvider() {
  const queryClient = useQueryClient();
  const { formId, sectionId } = useParams();
  const { token } = useAuth();
  const { data, isPending, error } = useMyApplicationResponseAndForm(formId);
  const saveMutation = useMutation({
    mutationFn: async (r: ApplicationResponse) => {
      const tok = await token();
      if (!tok) throw new Error("Not authenticated");
      return await saveApplicationResponse(r, tok);
    },
  });
  const [response, setResponse] = useState<ApplicationResponse | undefined>();
  const [selectedRoles, setSelectedRoles] = useState<ApplicantRole[]>([]);

  useEffect(() => {
    setResponse((old) =>
      old
        ? {
            ...old,
            rolesApplied: selectedRoles,
          }
        : old,
    );
  }, [selectedRoles]);

  useEffect(() => {
    if (data) {
      let rsid = undefined;
      for (const section of data.form.sections) {
        const rs = section.questions.find(
          (q) => q.questionType === QuestionType.RoleSelect,
        );
        if (rs !== undefined) {
          rsid = rs.questionId;
        }
      }

      for (const section of data.response.sectionResponses) {
        const roleResponse = section.questions.find(
          (q) => q.questionId === rsid,
        ) as QuestionResponse | undefined;
        if (roleResponse) {
          setSelectedRoles(roleResponse.response as ApplicantRole[]);
        }
      }
    }
  }, [data]);

  useEffect(() => {
    if (data !== undefined) {
      if (response === undefined) {
        setResponse(data.response);
      }
    }
  }, [data]);

  const SAVE_DEBOUNCE_SEC = 2;

  const save = useCallback(async () => {
    try {
      if (response) await saveMutation.mutateAsync(response);
    } catch (err) {
      console.error("Save failed!");
      console.error(err);
      throwErrorToast("Failed to save your application!");
    }
    await queryClient.invalidateQueries({
      predicate: (q) =>
        q.queryKey.includes("responses") ||
        q.queryKey.includes("responses-and-semester"),
    });
  }, [response, saveMutation, queryClient]);

  useEffect(() => {
    const ref = setTimeout(() => {
      save();
    }, SAVE_DEBOUNCE_SEC * 1000);

    return () => {
      clearTimeout(ref);
    };
  }, [response]);

  const sections = useMemo(() => {
    if (!data) return [];
    return data.form.sections
      .filter((s) => {
        if (s.forRoles) {
          return s.forRoles.filter((r) => selectedRoles.includes(r)).length > 0;
        } else {
          return true;
        }
      })
      .map((s) => s.sectionId);
  }, [selectedRoles, data]);

  const updateQuestionResponse = useCallback(
    (sectionId: string, questionId: string, resp: string | string[]) => {
      setResponse((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          dateSubmitted: Timestamp.now(),
          sectionResponses: prev.sectionResponses.map((s) => {
            if (s.sectionId === sectionId) {
              return {
                ...s,
                questions: s.questions.map((q) =>
                  q.questionId === questionId ? { ...q, response: resp } : q,
                ),
              };
            }
            return s;
          }),
        };
      });
    },
    [],
  );

  const nextSection = useCallback(() => {
    const idx = sections.findIndex((s) => s === sectionId);
    if (idx >= 0 && idx + 1 < sections.length) {
      return sections[idx + 1];
    } else {
      return sectionId ?? "";
    }
  }, [sections, sectionId]);

  const previousSection = useCallback(() => {
    const idx = sections.findIndex((s) => s === sectionId);
    if (idx >= 1) {
      return sections[idx - 1];
    } else {
      return sectionId ?? "";
    }
  }, [sections, sectionId]);

  const contextValue = useMemo(
    () => ({
      form: data?.form,
      response: response,
      updateQuestionResponse,
      save,
      selectedRoles,
      setSelectedRoles,
      availableSections: sections,
      currentSection: sectionId,
      nextSection,
      previousSection,
    }),
    [
      data?.form,
      response,
      updateQuestionResponse,
      save,
      selectedRoles,
      sections,
      sectionId,
      nextSection,
      previousSection,
    ],
  );

  if (isPending) return <Loading />;
  if (error) return <p>Something went wrong: {error.message}</p>;
  const { response: dbResponse } = data;

  //NOTE: not sure if it's a good idea to put this here, this component might need to be reused
  //in a case where in-progress apps are allowed. But for now, this is the best way to prevent
  //editing apps that are complete!
  if (dbResponse.status !== ApplicationStatus.InProgress)
    return <Navigate to="/apply/status" />;

  return (
    <FormContext.Provider value={contextValue}>
      <div className="w-full flex flex-row p-2 items-center justify-center">
        <div className="w-full max-w-3xl flex flex-row items-center">
          <div className="grow">
            <div
              className={`w-fit ${saveMutation.isError ? "bg-red-100" : "bg-lightblue"} rounded-full px-2 text-blue`}
            >
              {saveMutation.isPending ? (
                <p className="pulse font-bold flex flex-row items-center gap-1">
                  <Spinner className="inline size-4" />
                  Saving...
                </p>
              ) : saveMutation.submittedAt !== 0 && !saveMutation.isError ? (
                <p>
                  Last save:{" "}
                  {new Date(saveMutation.submittedAt).toLocaleTimeString()}
                </p>
              ) : saveMutation.isError ? (
                <p className="text-red-500">
                  Failed to save your application (Last save:{" "}
                  {new Date(saveMutation.submittedAt).toLocaleTimeString()})
                </p>
              ) : (
                <p>Form not yet saved!</p>
              )}
            </div>
          </div>
          <Button
            disabled={saveMutation.isPending}
            className="cursor-pointer p-2 bg-blue disabled:bg-blue/50 disabled:cursor-wait rounded text-white"
            onClick={save}
          >
            Save application
          </Button>
        </div>
      </div>
      <Outlet />
    </FormContext.Provider>
  );
}
