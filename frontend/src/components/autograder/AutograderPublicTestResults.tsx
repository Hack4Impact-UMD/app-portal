import type {
  PublicTests,
  SuiteResult,
  SuiteResults,
  TestResult,
} from "@app-portal/shared/types";
import { ClipboardList } from "lucide-react";

import AutograderExpandableRow from "@/components/autograder/AutograderExpandableRow";
import AutograderLogBlock from "@/components/autograder/AutograderLogBlock";
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
  const suiteSummary = `${suite.result.passed}/${suite.result.total} passed · ${suite.result.points}/${suite.result.totalPoints} pts · ${displayDurationMs(suite.result.durationMs)}`;

  return (
    <AutograderExpandableRow
      className="px-5 py-4"
      contentClassName="rounded-md bg-blue/5"
      status={passed ? "complete" : "failed"}
      rightLabel={suiteStatus}
      subtitle={suiteSummary}
      title={suite.suiteName}
    >
      {hasTestLogs
        ? tests.map(([testName, test]) => (
            <TestLogBlock key={`${suite.suiteName}-${testName}`} test={test} />
          ))
        : undefined}
    </AutograderExpandableRow>
  );
}

function TestLogBlock({ test }: { test: TestResult }) {
  const testStatus = test.passed ? "Passed" : "Failed";
  const subtitle = `${test.suite} · ${displayDurationMs(test.durationMs)}`;

  if (test.passed) {
    return (
      <AutograderExpandableRow
        className="border-b border-blue/10 px-3 py-3 last:border-b-0"
        status="complete"
        rightLabel={testStatus}
        subtitle={subtitle}
        title={test.testName}
      />
    );
  }

  return (
    <AutograderExpandableRow
      className="border-b border-blue/10 px-3 py-3 last:border-b-0"
      contentClassName="mt-2 space-y-2"
      status="failed"
      rightLabel={testStatus}
      subtitle={subtitle}
      title={test.testName}
    >
      <AutograderLogBlock label="stdout" output={test.stdout} />
      <AutograderLogBlock label="stderr" output={test.stderr} />
      {test.errors.length > 0 && (
        <AutograderLogBlock
          label="Errors"
          output={test.errors.map((error) => `- ${error}`).join("\n")}
        />
      )}
    </AutograderExpandableRow>
  );
}

export default function AutograderPublicTestResults({
  suiteResults,
  publicTests,
}: AutograderPublicTestResultsProps) {
  const suiteLogs = groupSuiteResults(suiteResults, publicTests);

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

      <div className="divide-y">
        {suiteLogs.map((suite) => (
          <SuiteLogDropdown key={suite.suiteName} suite={suite} />
        ))}
      </div>
    </section>
  );
}
