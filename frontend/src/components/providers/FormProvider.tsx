import type { ApplicantRole } from "@app-portal/shared/constants";
import { ApplicationStatus, QuestionType } from "@app-portal/shared/constants";
import type { QuestionResponse } from "@app-portal/shared/types";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Timestamp } from "firebase/firestore";
import { useEffect, useMemo, useState, useCallback } from "react";
import { Navigate, Outlet, useParams } from "react-router-dom";

import Loading from "@/components/Loading";
import { throwErrorToast } from "@/components/toasts/ErrorToast";
import { trpc } from "@/config/trpc";
import type { SaveStatus } from "@/contexts/formContext";
import { FormContext } from "@/contexts/formContext";
import { useMyApplicationResponseAndForm } from "@/hooks/useApplicationResponses";
import type { ApplicationResponse } from "@/types/types";

export default function FormProvider() {
  const queryClient = useQueryClient();
  const { formId, sectionId } = useParams();
  const { data, isPending, error } = useMyApplicationResponseAndForm(formId);
  const saveMutation = useMutation(trpc.application.save.mutationOptions());
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
        );
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
      queryKey: trpc.application.pathKey(),
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

  const saveStatus = useMemo<SaveStatus>(() => {
    if (saveMutation.isPending) {
      return {
        isSaving: true,
        isError: false,
        saved: false,
      };
    } else if (saveMutation.isError) {
      return {
        isError: true,
        saved: false,
      };
    } else {
      return {
        saved: true,
        lastSavedAt: saveMutation.submittedAt,
        isError: false,
      };
    }
  }, [saveMutation.isPending, saveMutation.isError, saveMutation.submittedAt]);

  const contextValue = useMemo(
    () => ({
      form: data?.form,
      response: response,
      updateQuestionResponse,
      save,
      saveStatus,
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
      saveStatus,
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
      <Outlet />
    </FormContext.Provider>
  );
}
