import type {
  PublicTests,
  SuiteResult,
  SuiteResults,
  TestResult,
} from "@app-portal/shared/types";
import { ChevronDown } from "lucide-react";

import AutograderLogBlock from "@/components/autograder/AutograderLogBlock";
import AutograderStatusIcon from "@/components/autograder/AutograderStatusIcon";
import { displayDurationMs } from "@/utils/display";

type AutograderPublicTestResultsProps = {
  suiteResults: SuiteResults;
  publicTests: PublicTests;
};

// view model for combined SuiteResult and PublicTests
type SuiteTestLogs = {
  suiteName: string;
  result: SuiteResult;
  tests: PublicTests[string];
};

function getSuitePassed(suite: SuiteTestLogs) {
  return suite.result.failed === 0;
}

function getPublicTestLogs(publicTests: PublicTests, suiteName: string) {
  return Object.fromEntries(
    Object.entries(publicTests[suiteName] ?? {}).filter(
      ([, test]) => !test.pending,
    ),
  );
}

function groupSuiteResults(
  suiteResults: SuiteResults,
  publicTests: PublicTests,
): SuiteTestLogs[] {
  return Object.entries(suiteResults).map(([suiteName, result]) => ({
    suiteName,
    result,
    tests: getPublicTestLogs(publicTests, suiteName),
  }));
}

function SuiteLogDropdown({ suite }: { suite: SuiteTestLogs }) {
  const passed = getSuitePassed(suite);
  const tests = Object.entries(suite.tests);
  const hasTestLogs = tests.length > 0;
  const suiteStatus = passed ? "Passed" : "Failed";
  const suiteSummary = `${suite.result.passed}/${suite.result.total} passed - ${suite.result.points}/${suite.result.totalPoints} pts - ${displayDurationMs(suite.result.durationMs)}`;

  if (!hasTestLogs) {
    return (
      <div className="flex items-center gap-3 px-5 py-4">
        <AutograderStatusIcon status={passed ? "complete" : "failed"} />
        <div className="min-w-0 flex-1">
          <p className="font-medium text-foreground">{suite.suiteName}</p>
          <p className="text-sm text-muted-foreground">{suiteSummary}</p>
        </div>
        <span
          className={`shrink-0 text-xs font-medium ${
            passed ? "text-green-700" : "text-destructive"
          }`}
        >
          {suiteStatus}
        </span>
      </div>
    );
  }

  return (
    <details className="group/suite px-5 py-4" open>
      <summary className="flex cursor-pointer list-none items-center gap-3">
        <AutograderStatusIcon status={passed ? "complete" : "failed"} />
        <div className="min-w-0 flex-1">
          <p className="font-medium text-foreground">{suite.suiteName}</p>
          <p className="text-sm text-muted-foreground">{suiteSummary}</p>
        </div>
        <span
          className={`shrink-0 text-xs font-medium ${
            passed ? "text-green-700" : "text-destructive"
          }`}
        >
          {suiteStatus}
        </span>
        <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground transition-colors hover:bg-slate-200">
          <ChevronDown className="size-5 transition-transform group-open/suite:rotate-180" />
        </span>
      </summary>

      <div className="mt-3 rounded-md bg-blue/5">
        {tests.map(([testName, test]) => (
          <TestLogBlock key={`${suite.suiteName}-${testName}`} test={test} />
        ))}
      </div>
    </details>
  );
}

function TestLogBlock({ test }: { test: TestResult }) {
  if (test.passed) {
    return (
      <div className="border-b border-blue/10 px-3 py-3 last:border-b-0">
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="font-medium text-foreground">{test.testName}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {test.suite} - {displayDurationMs(test.durationMs)}
            </p>
          </div>
          <span className="shrink-0 text-xs font-medium text-green-700">
            Passed
          </span>
        </div>
      </div>
    );
  }

  return (
    <details
      className="group/test border-b border-blue/10 px-3 py-3 last:border-b-0"
      open
    >
      <summary className="flex cursor-pointer list-none items-center gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="font-medium text-foreground">{test.testName}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {test.suite} - {displayDurationMs(test.durationMs)}
              </p>
            </div>
            <span className="shrink-0 text-xs font-medium text-destructive">
              Failed
            </span>
          </div>
        </div>
        <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-background text-muted-foreground transition-colors hover:bg-slate-200">
          <ChevronDown className="size-4 transition-transform group-open/test:rotate-180" />
        </span>
      </summary>

      <div className="mt-2 space-y-2">
        <AutograderLogBlock output={test.stdout} />
        <AutograderLogBlock output={test.stderr} />
        {test.errors.length > 0 && (
          <AutograderLogBlock
            output={test.errors.map((error) => `- ${error}`).join("\n")}
          />
        )}
      </div>
    </details>
  );
}

export default function AutograderPublicTestResults({
  suiteResults,
  publicTests,
}: AutograderPublicTestResultsProps) {
  const suiteLogs = groupSuiteResults(suiteResults, publicTests);

  if (suiteLogs.length === 0) return null;

  return (
    <section className="overflow-hidden rounded-md border bg-background shadow-xs">
      <div className="border-b bg-background px-5 py-4">
        <h2 className="text-lg font-semibold text-foreground">
          Public Test Results
        </h2>
      </div>

      <div className="divide-y">
        {suiteLogs.map((suite) => (
          <SuiteLogDropdown key={suite.suiteName} suite={suite} />
        ))}
      </div>
    </section>
  );
}
