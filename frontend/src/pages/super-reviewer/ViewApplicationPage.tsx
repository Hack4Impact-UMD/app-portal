import { useParams } from "react-router-dom";

import Section from "@/components/form/Section";
import Loading from "@/components/Loading";
import ApplicantRolePill from "@/components/role-pill/RolePill";
import Spinner from "@/components/Spinner";
import { useApplicant } from "@/hooks/useApplicants";
import { useApplicationForm } from "@/hooks/useApplicationForm";
import { useApplicationResponse } from "@/hooks/useApplicationResponses";
import type { ApplicationForm, ApplicationResponse } from "@/types/types";

type UserHeaderProps = {
  applicantId: string;
  form: ApplicationForm;
  response: ApplicationResponse;
};

function UserHeader({ applicantId, form, response }: UserHeaderProps) {
  const { data: applicant, isPending, error } = useApplicant(applicantId);

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
    <div className="w-full flex flex-col gap-4">
      <h1 className="font-bold text-4xl">
        {applicant.firstName} {applicant.lastName}'s {form.semester} Application
      </h1>
      <div className="flex flex-row gap-2 flex-wrap">
        {response.rolesApplied.map((role) => (
          <ApplicantRolePill key={role} role={role} />
        ))}
      </div>
    </div>
  );
}

export default function ViewApplicationPage() {
  const { responseId, formId } = useParams<{
    responseId: string;
    formId: string;
  }>();
  const {
    data: response,
    isPending: responsePending,
    error: responseError,
  } = useApplicationResponse(responseId);
  const {
    data: form,
    isPending: formPending,
    error: formError,
  } = useApplicationForm(formId);

  if (responsePending || formPending) return <Loading />;
  if (responseError)
    return <p>Failed to fetch response: {responseError.message}</p>;
  if (!response) return <p>Response not found!</p>;
  if (formError) return <p>Failed to fetch form: {formError.message} </p>;

  return (
    <div className="w-full flex flex-col bg-muted items-center p-4 pt-8 h-full">
      <div className="max-w-3xl w-full flex flex-col gap-2">
        <div className="w-full mb-2">
          <UserHeader
            applicantId={response.userId}
            form={form}
            response={response}
          />
        </div>
        {form.sections
          .filter((s) => {
            if (s.hideFromReviewers) return false;
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
              className="shadow border border-gray-200 rounded-md p-4"
              key={s.sectionId}
            >
              <Section
                responseId={response.id}
                key={s.sectionId}
                disabled={true}
                section={s}
                responses={
                  response.sectionResponses.find(
                    (r) => r.sectionId === s.sectionId,
                  )?.questions ?? []
                }
                onChangeResponse={() => {}}
                disabledRoles={form.disabledRoles ?? []}
              />
            </div>
          ))}
      </div>
    </div>
  );
}
