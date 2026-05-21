import type { RoleReviewRubric } from "@app-portal/shared/types";
import { ApplicantRole } from "@app-portal/shared/types";
import { useState, useEffect, useCallback } from "react";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { Button } from "@/components/ui/button";
import CodeEditor from "@/components/form/CodeEditor";
import { useApplicationForm } from "@/hooks/useApplicationForm";
import { useAuth } from "@/hooks/useAuth";
import Loading from "@/components/Loading";
import { useParams } from "react-router-dom";
import { Switch } from "@/components/ui/switch";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useRubricsForForm, useUploadRubrics } from "@/hooks/useRubrics";
import {
  useInterviewRubricsForForm,
  useUploadInterviewRubrics,
} from "@/hooks/useInterviewRubrics";
import RoleRubric from "@/components/reviewer/rubric/RoleRubric";
import { AlertTriangleIcon } from "lucide-react";
import { throwErrorToast } from "@/components/toasts/ErrorToast";
import { throwSuccessToast } from "@/components/toasts/SuccessToast";
import { displayApplicantRoleNameNoEmoji } from "@/utils/display";
import type { RubricValidationWarnings } from "@/services/rubricService";
import { validateRubricScoreKeys } from "@/services/rubricService";

function ValidationWarningDisplay({
  warnings,
}: {
  warnings: RubricValidationWarnings;
}) {
  return (
    <>
      {warnings.missingInForm.length > 0 && (
        <div className="bg-amber-100 border border-amber-600 text-amber-700 flex flex-row gap-2 p-2 rounded">
          <AlertTriangleIcon />
          <div>
            <strong>WARNING:</strong> The following keys are in the rubrics but
            missing from the form:
            <ul className="list-disc list-inside">
              {warnings.missingInForm.map(({ role, scoreKey }, index) => (
                <li key={index}>
                  <strong>{displayApplicantRoleNameNoEmoji(role)}:</strong>{" "}
                  {scoreKey}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
      {warnings.missingInRubric.length > 0 && (
        <div className="bg-amber-100 border border-amber-600 text-amber-700 flex flex-row gap-2 p-2 rounded">
          <AlertTriangleIcon />
          <div>
            <strong>WARNING:</strong> The following weights are in the form but
            not used in any rubric:
            <ul className="list-disc list-inside">
              {warnings.missingInRubric.map(({ role, scoreWeight }, index) => (
                <li key={index}>
                  <strong>{displayApplicantRoleNameNoEmoji(role)}:</strong>{" "}
                  {scoreWeight}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </>
  );
}

export default function RubricBuilderPage() {
  const [jsonCode, setJsonCode] = useState("[]");
  const [previewRubrics, setPreviewRubrics] = useState<RoleReviewRubric[]>([]);
  const [compileError, setCompileError] = useState<string | null>(null);
  const [autoCompile, setAutoCompile] = useState(false);
  const [rubricType, setRubricType] = useState<"application" | "interview">(
    "application",
  );
  const [validationWarnings, setValidationWarnings] =
    useState<RubricValidationWarnings | null>(null);

  const { formId } = useParams();
  const { token } = useAuth();

  const {
    data: form,
    isPending: isLoadingForm,
    error: loadFormError,
  } = useApplicationForm(formId, false);

  const {
    data: applicationRubrics,
    isPending: isLoadingAppRubrics,
    error: loadAppRubricsError,
  } = useRubricsForForm(formId);

  const {
    data: interviewRubrics,
    isPending: isLoadingIntRubrics,
    error: loadIntRubricsError,
  } = useInterviewRubricsForForm(formId);

  const uploadRubricsMutation = useUploadRubrics();
  const uploadInterviewRubricsMutation = useUploadInterviewRubrics();

  useEffect(() => {
    const rubrics =
      rubricType === "application" ? applicationRubrics : interviewRubrics;

    if (rubrics) {
      const rubricsWithCorrectedId = rubrics.map((rubric) => ({
        ...rubric,
        formId: formId ?? "",
      }));

      const formattedJson = JSON.stringify(rubricsWithCorrectedId, null, 2);
      setJsonCode(formattedJson);
    }
  }, [applicationRubrics, formId, interviewRubrics, rubricType]);

  const handleCompile = useCallback(() => {
    try {
      const parsed = (JSON.parse(jsonCode) as RoleReviewRubric[]).map(
        (rubric) => ({
          ...rubric,
          formId: formId ?? "",
        }),
      );
      setPreviewRubrics(parsed);
      setCompileError(null);

      if (form) {
        const warnings = validateRubricScoreKeys(
          parsed,
          form,
          rubricType === "interview",
        );
        setValidationWarnings(warnings);
      }
    } catch (error) {
      console.error("Invalid JSON:", error);
      setCompileError(error instanceof Error ? error.message : "Invalid JSON");
    }
  }, [jsonCode, rubricType, formId, form]);

  const handleUpload = useCallback(async () => {
    const parsedRubrics = (JSON.parse(jsonCode) as RoleReviewRubric[]).map(
      (rubric) => ({
        ...rubric,
        formId: formId ?? "",
      }),
    );

    let confirmMessage = `This will upload ${parsedRubrics.length} ${rubricType} rubric(s) for form '${formId}'.\n\n`;

    if (
      validationWarnings &&
      (validationWarnings.missingInForm.length ||
        validationWarnings.missingInRubric.length)
    ) {
      confirmMessage +=
        "WARNING: Mismatch detected between form weights and keys. Review changes and change forms if necessary.\n\n";
    }

    confirmMessage += "Do you want to continue?";

    const confirmed = window.confirm(confirmMessage);
    if (!confirmed) return;

    const rubricIdSet = new Set<string>();
    let duplicates = false;

    parsedRubrics.forEach((rubric) => {
      if (rubricIdSet.has(rubric.id)) {
        throwErrorToast("Duplicate rubric ID: " + rubric.id);
        duplicates = true;
        return;
      } else {
        rubricIdSet.add(rubric.id);
      }
    });

    if (duplicates) return;

    if (rubricType === "application") {
      uploadRubricsMutation.mutate(
        { rubrics: parsedRubrics, token: (await token()) ?? "" },
        {
          onSuccess: () => {
            throwSuccessToast(
              `Successfully uploaded ${parsedRubrics.length} rubric(s)!`,
            );
          },
          onError: (error) => {
            console.error("Upload error:", error);
            throwErrorToast("Failed to upload rubrics!");
          },
        },
      );
    } else {
      uploadInterviewRubricsMutation.mutate(
        { interviewRubrics: parsedRubrics, token: (await token()) ?? "" },
        {
          onSuccess: () => {
            throwSuccessToast(
              `Successfully uploaded ${parsedRubrics.length} rubric(s)!`,
            );
          },
          onError: (error) => {
            console.error("Upload error:", error);
            throwErrorToast("Failed to upload rubrics!");
          },
        },
      );
    }
  }, [
    jsonCode,
    rubricType,
    formId,
    validationWarnings,
    uploadRubricsMutation,
    token,
    uploadInterviewRubricsMutation,
  ]);

  useEffect(() => {
    if (autoCompile) {
      handleCompile();
    }
  }, [jsonCode, autoCompile, handleCompile]);

  if (!formId) {
    return <p>Form ID not specified!</p>;
  }

  if (isLoadingForm || isLoadingAppRubrics || isLoadingIntRubrics) {
    return <Loading />;
  }

  if (loadFormError || loadAppRubricsError || loadIntRubricsError) {
    return (
      <div className="p-4 w-full flex flex-col items-center justify-center h-[calc(100vh-4rem)]">
        <div className="text-center">
          <h2 className="text-xl font-bold text-red-600 mb-2">
            Failed to Load Form or Rubrics
          </h2>
          <p className="text-gray-600">
            {loadFormError?.message ||
              loadAppRubricsError?.message ||
              loadIntRubricsError?.message}
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
            <h1 className="font-bold text-2xl">Rubric Builder</h1>
            {form && (
              <span className="text-muted-foreground text-sm">- {form.id}</span>
            )}
            <ToggleGroup
              type="single"
              value={rubricType}
              onValueChange={(value) =>
                value && setRubricType(value as "application" | "interview")
              }
            >
              <ToggleGroupItem
                value="application"
                className="data-[state=on]:bg-blue data-[state=on]:text-white bg-white cursor-pointer px-3"
              >
                Application
              </ToggleGroupItem>
              <ToggleGroupItem
                value="interview"
                className="data-[state=on]:bg-blue data-[state=on]:text-white bg-white cursor-pointer px-3"
              >
                Interview
              </ToggleGroupItem>
            </ToggleGroup>
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
              onClick={handleUpload}
              disabled={
                uploadRubricsMutation.isPending ||
                uploadInterviewRubricsMutation.isPending
              }
              className="bg-green-600 hover:bg-green-700"
            >
              {uploadRubricsMutation.isPending ||
              uploadInterviewRubricsMutation.isPending
                ? "Uploading..."
                : "Upload Rubrics"}
            </Button>
          </div>
        </div>

        <ResizablePanelGroup
          direction="horizontal"
          className="flex-1 mt-2 min-h-0"
        >
          <ResizablePanel defaultSize={50} minSize={30}>
            <CodeEditor
              value={jsonCode}
              onChange={setJsonCode}
              placeholderText="Enter your rubrics JSON here..."
              language="json"
              className="h-full"
            />
          </ResizablePanel>
          <ResizableHandle withHandle />
          <ResizablePanel defaultSize={50} minSize={30}>
            <div className="w-full h-full flex flex-col border border-gray-300 rounded-md overflow-hidden bg-white shadow-sm">
              <div className="bg-gray-800 px-4 py-2 border-b border-gray-300">
                <h3 className="text-md font-medium text-white">
                  Rubric Preview
                </h3>
              </div>
              <div className="flex flex-col h-full relative">
                {compileError && (
                  <div className="text-red-600 bg-white/90 text-center py-8 flex flex-col items-center justify-center absolute top-0 left-0 right-0 bottom-0">
                    <h4 className="font-semibold mb-2">Compilation Error</h4>
                    <p className="text-sm font-bold">{compileError}</p>
                  </div>
                )}
                <div className="flex-1 overflow-y-auto p-2 bg-gray-50">
                  {previewRubrics ? (
                    <div className="space-y-4">
                      {validationWarnings && (
                        <ValidationWarningDisplay
                          warnings={validationWarnings}
                        />
                      )}

                      {previewRubrics.map((rubric) => (
                        <RoleRubric
                          key={rubric.id}
                          rubric={rubric}
                          role={
                            rubric.roles.length > 0
                              ? rubric.roles[0]
                              : ApplicantRole.Bootcamp
                          }
                          onScoreChange={() => {}}
                          onCommentChange={() => {}}
                          disabled={true}
                          form={form}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="text-gray-500 text-center py-8 text-lg">
                      Click "Compile" to preview your rubrics
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
