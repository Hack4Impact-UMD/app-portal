import { useParams, useNavigate } from "react-router-dom";

import Section from "@/components/form/Section";
import Loading from "@/components/Loading";
import { Button } from "@/components/ui/button";
import { useMyApplicationResponseAndForm } from "@/hooks/useApplicationResponses";

export default function AppRevisitPage() {
  const { formId } = useParams();
  const navigate = useNavigate();
  const { data, isPending, error } = useMyApplicationResponseAndForm(formId);

  if (isPending) return <Loading />;
  if (error) return <p>Something went wrong: {error.message}</p>;

  const { form, response } = data;

  // if (response.status === ApplicationStatus.InProgress) {
  //   throw {
  //     status: 403,
  //     statusText: "Forbidden",
  //     data: "You cannot revisit an incomplete application.",
  //   } as ErrorResponse;
  // }

  return (
    <div className="w-full flex flex-col bg-muted items-center p-4 pt-8">
      <div className="max-w-3xl w-full flex flex-col gap-2">
        <div className="mb-2">
          <h1 className="text-3xl font-bold">
            Your {form.semester} Application
          </h1>
          <p className="text-muted-foreground">
            Application responses are final once submitted.
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
                  )!.questions
                }
                onChangeResponse={() => {}}
                disabledRoles={form.disabledRoles ?? []}
              />
            </div>
          ))}
        <Button
          className="rounded-full"
          onClick={() => navigate("/apply/status")}
        >
          Back to Application Status
        </Button>
      </div>
    </div>
  );
}
