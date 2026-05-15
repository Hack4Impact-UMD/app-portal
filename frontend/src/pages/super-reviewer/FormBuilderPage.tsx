import { useState, useEffect, useCallback, Fragment } from "react";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { Button } from "@/components/ui/button";
import { h4iApplicationForm } from "@/data/h4i-application-form";
import CodeEditor from "@/components/form/CodeEditor";
import Section from "@/components/form/Section";
import FormMarkdown from "@/components/form/FormMarkdown";
import { ApplicationForm, ApplicationSection } from "@/types/formBuilderTypes";
import {
  useUploadApplicationForm,
  useApplicationForm,
} from "@/hooks/useApplicationForm";
import { useAuth } from "@/hooks/useAuth";
import { Timestamp } from "firebase/firestore";
import { throwErrorToast } from "@/components/toasts/ErrorToast";
import Loading from "@/components/Loading";
import { useParams } from "react-router-dom";
import { Switch } from "@/components/ui/switch";
import { AlertTriangleIcon } from "lucide-react";

const decisionLetterVariants = ["accepted", "waitlist"] as const;
const noop = () => {};
const capitalize = (str: string) =>
  str.substring(0, 1).toUpperCase() + str.substring(1);

export default function FormBuilderPage() {
  const [jsonCode, setJsonCode] = useState(() =>
    JSON.stringify(h4iApplicationForm, null, 2),
  );
  const [previewForm, setPreviewForm] = useState<ApplicationForm | null>(null);
  const [compileError, setCompileError] = useState<string | null>(null);
  const [autoCompile, setAutoCompile] = useState(false);

  const { formId } = useParams();
  const { token } = useAuth();
  const {
    mutate: uploadForm,
    isPending: isUploadingForm,
    error: formUploadError,
    data: formUploadData,
  } = useUploadApplicationForm();

  const {
    data: activeForm,
    isPending: isLoadingForm,
    error: loadFormError,
  } = useApplicationForm(formId, false);

  // Load active form into the editor
  useEffect(() => {
    if (activeForm && formId !== previewForm?.id) {
      try {
        // Convert Timestamp to ISO string for better readability
        const formWithDateString = {
          ...activeForm,
          id: formId,
          dueDate: activeForm.dueDate.toDate().toISOString(),
        };

        const formJson = JSON.stringify(formWithDateString, null, 2);
        setJsonCode(formJson);
      } catch (error) {
        console.error("Failed to load form:", error);
        throwErrorToast("Failed to load active form into editor");
      }
    }
  }, [activeForm, formId, previewForm?.id]);

  const handleCompile = useCallback(() => {
    try {
      const parsedForm = JSON.parse(jsonCode) as ApplicationForm;
      setPreviewForm({ ...parsedForm, id: formId ?? "" });
      setCompileError(null);
    } catch (error) {
      console.error("Invalid JSON:", error);
      setCompileError(error instanceof Error ? error.message : "Invalid JSON");
      // setPreviewForm(null);
    }
  }, [formId, jsonCode]);

  useEffect(() => {
    if (autoCompile) {
      handleCompile();
    }
  }, [autoCompile, handleCompile]);

  const handleUploadForm = async () => {
    try {
      const parsedForm: ApplicationForm = {
        ...JSON.parse(jsonCode),
        id: formId ?? "",
      };

      const confirmed = window.confirm(
        `Are you sure you want to upload this application form?\n\n` +
          `This will update the form with ID '${parsedForm.id}' in Firestore.`,
      );

      if (!confirmed || !token) return;

      // Validate for duplicate section and question IDs
      const sectionIdSet = new Set<string>();
      const questionIdSet = new Set<string>();
      let duplicates = false;

      parsedForm.sections.forEach((s) => {
        if (sectionIdSet.has(s.sectionId)) {
          throwErrorToast("Duplicate section ID: " + s.sectionId);
          duplicates = true;
          return;
        } else {
          sectionIdSet.add(s.sectionId);
        }

        s.questions.forEach((q) => {
          if (questionIdSet.has(q.questionId)) {
            throwErrorToast("Duplicate question ID: " + q.questionId);
            duplicates = true;
            return;
          } else {
            questionIdSet.add(q.questionId);
          }
        });
      });

      if (duplicates) return;

      // Convert the dueDate ISO string back to a Timestamp
      const dueDateString = parsedForm.dueDate as unknown as string;
      const dueDate = Timestamp.fromDate(new Date(dueDateString));

      const formWithTimestamp = {
        ...parsedForm,
        dueDate: dueDate,
      };

      uploadForm({ form: formWithTimestamp, token: (await token()) ?? "" });
    } catch (error) {
      console.error("Upload error:", error);
      throwErrorToast(
        error instanceof Error ? error.message : "Failed to upload form",
      );
    }
  };

  if (!formId) {
    return <p>Form ID not specified!</p>;
  }

  if (isLoadingForm) {
    return <Loading />;
  }

  if (loadFormError) {
    return (
      <div className="p-4 w-full flex flex-col items-center justify-center h-[calc(100vh-4rem)]">
        <div className="text-center">
          <h2 className="text-xl font-bold text-red-600 mb-2">
            Failed to Load Active Form
          </h2>
          <p className="text-gray-600">
            {loadFormError instanceof Error
              ? loadFormError.message
              : String(loadFormError)}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 w-full flex flex-col items-center h-[calc(100vh-4rem)] overflow-hidden">
      <div className="w-full max-w-8xl h-full flex flex-col">
        <div className="flex justify-between items-center flex-shrink-0">
          <div className="flex items-center gap-2">
            <h1 className="font-bold text-2xl">Form Builder</h1>
            {previewForm && (
              <span className="text-muted-foreground text-sm">
                - {previewForm.id}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2">
              <span>Auto-compile</span>
              <Switch
                checked={autoCompile}
                onCheckedChange={setAutoCompile}
                className="h-5"
              />
            </div>
            <Button
              onClick={handleCompile}
              className="bg-blue hover:bg-blue/80"
            >
              Compile
            </Button>
            <Button
              onClick={handleUploadForm}
              disabled={isUploadingForm}
              className="bg-green-600 hover:bg-green-700"
            >
              {isUploadingForm ? "Uploading..." : "Upload Form"}
            </Button>
          </div>
        </div>

        {formUploadData && (
          <p className="mt-2 text-sm text-green-600">
            Success! Form uploaded with ID: {formUploadData.formId}
          </p>
        )}
        {formUploadError && (
          <p className="mt-2 text-sm text-red-600">{formUploadError.message}</p>
        )}
        <ResizablePanelGroup
          direction="horizontal"
          className="flex-1 mt-2 min-h-0"
        >
          <ResizablePanel defaultSize={50} minSize={30}>
            <CodeEditor
              value={jsonCode}
              onChange={setJsonCode}
              placeholderText="Enter your form JSON here..."
              language="json"
              className="h-full"
            />
          </ResizablePanel>
          <ResizableHandle withHandle />
          <ResizablePanel defaultSize={50} minSize={30}>
            <div className="w-full h-full flex flex-col border border-gray-300 rounded-md overflow-hidden bg-white shadow-sm">
              <div className="bg-gray-800 px-4 py-2 border-b border-gray-300">
                <h3 className="text-md font-medium text-white">Form Preview</h3>
              </div>
              <div className="flex flex-col h-full relative">
                {compileError && (
                  <div className="text-red-600 bg-white/90 text-center py-8 flex flex-col items-center justify-center absolute top-0 left-0 right-0 bottom-0">
                    <h4 className="font-semibold mb-2">Compilation Error</h4>
                    <p className="text-sm font-bold">{compileError}</p>
                  </div>
                )}

                <div className="flex flex-col gap-2 p-2">
                  {previewForm?.decisionsReleased && (
                    <div className="bg-amber-100 border border-amber-600 text-amber-600 flex flex-row gap-2 p-2 rounded">
                      <AlertTriangleIcon />{" "}
                      <span>
                        <strong>WARNING: </strong>This form has decisions
                        released set to true!
                      </span>
                    </div>
                  )}
                  {previewForm?.isActive && (
                    <div className="bg-amber-100 border border-amber-600 text-amber-600 flex flex-row gap-2 p-2 rounded">
                      <AlertTriangleIcon />{" "}
                      <span>
                        <strong>WARNING: </strong>This form is active!
                      </span>
                    </div>
                  )}
                </div>
                <div className="flex-1 overflow-y-auto p-2 bg-gray-50">
                  {previewForm ? (
                    <div className="space-y-6">
                      {decisionLetterVariants.map((variant) => (
                        <Fragment key={variant}>
                          <div className="bg-white p-4 rounded-md shadow-sm border">
                            <h1 className="text-lg font-bold mb-2">
                              Team {capitalize(variant)} Letter
                            </h1>
                            <FormMarkdown>
                              {previewForm.decisionLetter?.[variant].team ??
                                "N/A"}
                            </FormMarkdown>
                          </div>
                          <div className="bg-white p-4 rounded-md shadow-sm border">
                            <h1 className="text-lg font-bold mb-2">
                              Bootcamp {capitalize(variant)} Letter
                            </h1>
                            <FormMarkdown>
                              {previewForm.decisionLetter?.[variant].bootcamp ??
                                "N/A"}
                            </FormMarkdown>
                          </div>
                        </Fragment>
                      ))}
                      <div className="bg-white p-4 rounded-md shadow-sm border">
                        <h1 className="text-lg font-bold mb-2">
                          Denied Letter
                        </h1>
                        <FormMarkdown>
                          {previewForm.decisionLetter?.denied ?? "N/A"}
                        </FormMarkdown>
                      </div>
                      <div className="bg-white p-4 rounded-md shadow-sm border">
                        <h2 className="text-2xl font-bold mb-2">
                          {previewForm.semester}
                        </h2>
                        <FormMarkdown className="text-gray-600 mb-4">
                          {previewForm.description}
                        </FormMarkdown>
                      </div>
                      {previewForm.sections.map(
                        (section: ApplicationSection) => (
                          <div
                            key={section.sectionId}
                            className="bg-white p-4 rounded-md shadow-sm border"
                          >
                            <Section
                              section={section}
                              responses={[]}
                              responseId="preview"
                              disabled={true}
                              onChangeResponse={noop}
                              disabledRoles={previewForm.disabledRoles ?? []}
                            />
                          </div>
                        ),
                      )}
                    </div>
                  ) : (
                    <div className="text-gray-500 text-center py-8 text-lg">
                      Click "Compile" to preview your form
                    </div>
                  )}
                </div>
              </div>
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </div>
  );
}
