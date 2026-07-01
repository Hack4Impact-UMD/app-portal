import type {
  PublicTests,
  SuiteResult,
  SuiteResults,
  TestResult,
} from "@app-portal/shared/types";
import Ansi from "ansi-to-react";
import { CheckCircle2, ChevronDown, Circle, ClipboardList, XCircle } from "lucide-react";

import { displayDurationMs } from "@/utils/display";

type AutograderPublicTestResultsProps = {
  suiteResults: SuiteResults;
  tests: PublicTests;
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

function getSuitePending(suite: SuiteTestLogs) {
  const testsArr = Object.values(suite.tests);
  return testsArr.length > 0 && testsArr.every((test) => test.pending);
}

function getPublicTestLogs(publicTests: PublicTests, suiteName: string) {
  return publicTests[suiteName] ?? {};
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

function StatusIcon({
  passed,
  className = "size-4",
}: {
  passed: boolean;
  className?: string;
}) {
  if (passed) return <CheckCircle2 className={`${className} text-green-700`} />;

  return <XCircle className={`${className} text-destructive`} />;
}

function LabeledLogBlock({
  label,
  output,
}: {
  label: string;
  output: string;
}) {
  if (!output) return null;

  return (
    <div>
      <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <pre className="whitespace-pre-wrap rounded-sm border border-slate-200 bg-slate-50 px-2.5 py-2 font-mono text-xs leading-5 text-foreground">
        <Ansi>{output}</Ansi>
      </pre>
    </div>
  );
}

function SuiteLogDropdown({ suite }: { suite: SuiteTestLogs }) {
  const passed = getSuitePassed(suite);
  const pending = getSuitePending(suite);
  const tests = Object.entries(suite.tests);
  const hasTestLogs = tests.length > 0;
  const suiteSummary = `${suite.result.passed}/${suite.result.total} passed · ${suite.result.points}/${suite.result.totalPoints} pts · ${displayDurationMs(suite.result.durationMs)}`;
  const accent = pending
    ? "border-l-2 border-l-gray-300"
    : passed
      ? "border-l-2 border-l-green-600"
      : "border-l-2 border-l-destructive";

  if (!hasTestLogs) {
    return (
      <div className={`flex items-center gap-3 px-4 py-3 ${accent}`}>
        <div className="min-w-0 flex-1">
          <p className="text-base font-semibold text-foreground">
            {suite.suiteName}
          </p>
          <p className="text-sm text-muted-foreground">{suiteSummary}</p>
        </div>
      </div>
    );
  }

  return (
    <details className={`group/suite ${accent}`} open>
      <summary className="flex cursor-pointer list-none items-center gap-3 px-4 py-3">
        <div className="min-w-0 flex-1">
          <p className="text-base font-semibold text-foreground">
            {suite.suiteName}
          </p>
          <p className="text-sm text-muted-foreground">{suiteSummary}</p>
        </div>
        <ChevronDown className="size-4 shrink-0 text-muted-foreground transition-transform group-open/suite:rotate-180" />
      </summary>

      <div className="divide-y divide-border/60 border-t bg-muted/60">
        {tests.map(([testName, test]) => (
          <TestLogBlock key={`${suite.suiteName}-${testName}`} test={test} />
        ))}
      </div>
    </details>
  );
}

function TestLogBlock({ test }: { test: TestResult }) {
  if (test.pending) {
    return (
      <div className="flex items-center gap-3 bg-gray-100 px-3 py-2.5">
        <Circle className="size-4 shrink-0 text-muted-foreground" />
        <p className="min-w-0 flex-1 truncate text-sm text-foreground">
          {test.testName}
        </p>
        <span className="shrink-0 text-sm text-muted-foreground">
          Pending
        </span>
      </div>
    );
  }

  if (test.passed) {
    return (
      <div className="flex items-center gap-3 border-l-4 border-l-green-600 bg-green-50/60 px-3 py-2.5">
        <StatusIcon passed />
        <p className="min-w-0 flex-1 truncate text-sm text-foreground">
          {test.testName}
        </p>
        <span className="shrink-0 text-sm text-muted-foreground">
          {test.points} pts · {displayDurationMs(test.durationMs)}
        </span>
      </div>
    );
  }

  return (
    <details className="group/test bg-destructive/10 px-3 py-2.5" open>
      <summary className="flex cursor-pointer list-none items-center gap-3">
        <StatusIcon passed={false} />
        <p className="min-w-0 flex-1 truncate text-sm text-foreground">
          {test.testName}
        </p>
        <span className="shrink-0 text-sm text-muted-foreground">
          {test.points} pts · {displayDurationMs(test.durationMs)}
        </span>
        <ChevronDown className="size-4 shrink-0 text-muted-foreground transition-transform group-open/test:rotate-180" />
      </summary>

      <div className="mt-2 space-y-2">
        <LabeledLogBlock label="stdout" output={test.stdout} />
        <LabeledLogBlock label="stderr" output={test.stderr} />
        {test.errors.length > 0 && (
          <LabeledLogBlock
            label="Errors"
            output={test.errors.map((error) => `- ${error}`).join("\n")}
          />
        )}
      </div>
    </details>
  );
}

export default function AutograderPublicTestResults({
  suiteResults,
  tests,
}: AutograderPublicTestResultsProps) {
  const suiteLogs = groupSuiteResults(suiteResults, tests);

  if (suiteLogs.length === 0) {
    return (
      <section className="flex flex-col items-center gap-2 rounded-md border bg-background px-4 py-10 text-center shadow-xs">
        <ClipboardList className="size-6 text-muted-foreground" />
        <p className="font-medium text-foreground">No test suites yet</p>
        <p className="text-sm text-muted-foreground">
          Public test results will appear here once the autograder parses the test repo.
        </p>
      </section>
    );
  }

  const suitesPassed = suiteLogs.filter(getSuitePassed).length;

  return (
    <section className="overflow-hidden rounded-md border bg-background shadow-xs">
      <div className="flex items-center justify-between gap-3 border-b bg-background px-4 py-3">
        <h2 className="text-lg font-semibold text-foreground">
          Public Test Results
        </h2>
        <span className="shrink-0 text-sm text-muted-foreground">
          {suitesPassed}/{suiteLogs.length} suites passed
        </span>
      </div>

      <div className="divide-y-4 divide-muted">
        {suiteLogs.map((suite) => (
          <SuiteLogDropdown key={suite.suiteName} suite={suite} />
        ))}
      </div>
    </section>
  );
}
