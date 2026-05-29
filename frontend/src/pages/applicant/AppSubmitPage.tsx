import type { ValidationError } from "@app-portal/shared/types";
import { useMutation } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { Timestamp } from "firebase/firestore";
import { EditIcon } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import Section from "@/components/form/Section";
import Loading from "@/components/Loading";
import { throwErrorToast } from "@/components/toasts/ErrorToast";
import { Button } from "@/components/ui/button";
import { useMyApplicationResponseAndForm } from "@/hooks/useApplicationResponses";
import { useAuth } from "@/hooks/useAuth";
import type { ApplicationSubmitResponse } from "@/services/applicationResponsesService";
import { submitApplicationResponse } from "@/services/applicationResponsesService";
import type { ApplicationResponse } from "@/types/types";

export default function AppSubmitPage() {
  const { formId } = useParams();
  const navigate = useNavigate();
  const { data, isPending, error } = useMyApplicationResponseAndForm(formId);
  const { token } = useAuth();
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>(
    [],
  );

  const submitMutation = useMutation({
    mutationFn: async (response: ApplicationResponse) =>
      submitApplicationResponse(response, (await token()) ?? ""),
  });

  if (isPending) return <Loading />;
  if (error) return <p>Something went wrong: {error.message}</p>;

  const { form, response } = data;

  async function handleSubmit() {
    try {
      const resp = await submitMutation.mutateAsync(response);
      console.log("Submit Response:", resp);
      if (resp.status === "success") {
        navigate("/apply/success");
      }
    } catch (err) {
      console.error("Submit error");
      if (err instanceof AxiosError) {
        const resp = err.response?.data as ApplicationSubmitResponse;
        if (resp.status === "error") {
          throwErrorToast("Oops, looks like you've missed some things!");
          setValidationErrors(resp.validationErrors ?? []);
        } else if (Timestamp.now() > form.dueDate) {
          throwErrorToast("Due date has passed");
        }
      }
    }
  }

  return (
    <div className="w-full flex flex-col items-center p-4 pt-8 bg-muted">
      <div className="max-w-3xl w-full flex flex-col gap-2">
        <div>
          <h1 className="text-3xl font-bold">Almost there!</h1>
          <p className="text-muted-foreground">
            Review your application before submitting.
          </p>
        </div>
        {form.sections
          .filter((s) => {
            if (s.forRoles) {
              return (
                s.forRoles.filter((r) => response.rolesApplied.includes(r))
                  .length > 0
              );
            } else {
              return true;
            }
          })
          .map((s) => (
            <div
              className="shadow border border-gray-200 bg-white rounded-md p-4"
              key={s.sectionId}
            >
              <Link
                className="text-blue "
                to={`/apply/f/${formId}/${s.sectionId}`}
              >
                <div className="flex gap-1 items-center text-sm">
                  <EditIcon className="size-4" />
                  <p className="underline">Edit this section</p>
                </div>
              </Link>
              <Section
                responseId={response.id}
                key={s.sectionId}
                validationErrors={validationErrors}
                disabled={true}
                section={s}
                responses={
                  response.sectionResponses.find(
                    (r) => r.sectionId === s.sectionId,
                  )!.questions
                }
                onChangeResponse={() => {}}
                disabledRoles={form.disabledRoles ?? []}
              />
            </div>
          ))}
        <Button
          disabled={submitMutation.isPending}
          className="rounded-full"
          onClick={() => handleSubmit()}
        >
          Submit
        </Button>
      </div>
    </div>
  );
}
