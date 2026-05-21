import React, { useMemo, useState } from "react";
import { useActiveForm } from "../../hooks/useApplicationForm";
import Loading from "../../components/Loading";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useMyApplicationResponses } from "@/hooks/useApplicationResponses";
import FormMarkdown from "@/components/form/FormMarkdown";
import { Timestamp } from "firebase/firestore";
import { ApplicationStatus } from "@app-portal/shared/types";

const AppOverview: React.FC = () => {
  const {
    data: form,
    isPending: formLoading,
    error: formError,
  } = useActiveForm();
  const {
    data: applications,
    isPending: appsLoading,
    error: appsError,
  } = useMyApplicationResponses();

  const applied = useMemo(() => {
    console.log("applications:", applications);
    if (form && applications)
      return applications
        .filter((app) => app.status === ApplicationStatus.Submitted)
        .map((app) => app.applicationFormId)
        .includes(form.id);
    else return false;
  }, [applications, form]);

  const inProgress = useMemo(() => {
    if (form && applications)
      return applications
        .filter((app) => app.status === ApplicationStatus.InProgress)
        .map((app) => app.applicationFormId)
        .includes(form.id);
    else return false;
  }, [applications, form]);

  const navigate = useNavigate();
  const [wait, setWait] = useState(false);

  if (appsLoading || formLoading) return <Loading />;
  if (appsError)
    return (
      <p>
        Something went wrong while fetching your applications:{" "}
        {appsError.message}
      </p>
    );
  if (formError)
    return (
      <p>Something went wrong while fetching this form: {formError.message}</p>
    );

  if (!form)
    return (
      <div className="mt-5 mx-auto max-w-5xl w-full px-5 py-5 font-sans leading-relaxed">
        <h1 className="mb-3 text-5xl text-black">Overview</h1>
        <div className="flex gap-2 flex-col sm:flex-row items-start justify-between mb-5">
          There are no active forms at the moment.
        </div>
      </div>
    );

  async function handleApply() {
    setWait(true);
    navigate(`/apply/f/${form!.id}/${form!.sections[0].sectionId}`);
    setWait(false);
  }
  return (
    <div className="flex flex-col items-center">
      <div className="mt-5 mb-5 max-w-5xl w-full px-10 py-5 font-sans leading-relaxed h-full rounded-xl shadow-sm border border-gray-200 bg-gray-50">
        <h1 className="mb-3 text-5xl text-black">Overview</h1>
        <div className="flex gap-2 flex-col sm:flex-row items-start justify-between mb-5">
          <div className="flex flex-col">
            <h2 className="text-blue text-2xl">Hack4Impact-UMD New Member</h2>
            <h3 className="text-blue text-2xl">Application {form.semester}</h3>
            <p className="text-gray-500 text-lg">
              Due:{" "}
              {form.dueDate.toDate().toLocaleString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
                hour: "numeric",
                minute: "2-digit",
                hour12: true,
                timeZoneName: "short",
              })}
            </p>
          </div>
          {
            <Button
              onClick={handleApply}
              disabled={wait || (Timestamp.now() > form.dueDate && !applied)}
              className="w-full sm:w-fit cursor-pointer inline-flex items-center justify-center px-10 py-2 rounded-full bg-black 
                text-white transition-colors hover:bg-darkgray"
            >
              {applied
                ? "Go to status page"
                : Timestamp.now() <= form.dueDate
                  ? inProgress
                    ? "Continue Application"
                    : "Apply"
                  : "Application Closed"}
            </Button>
          }
        </div>
        <div className="font-[Karla] text-sm font-normal leading-tight text-justify [text-justify:inter-word] h-full">
          <FormMarkdown className="text-black">{form.description}</FormMarkdown>
        </div>
      </div>
    </div>
  );
};

export default AppOverview;
