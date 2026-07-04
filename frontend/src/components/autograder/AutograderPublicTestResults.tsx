import type {
  Tests,
  SuiteResult,
  SuiteResults,
  TestResult,
} from "@app-portal/shared/types";
import { ChevronDown, ClipboardList } from "lucide-react";

import AutograderExpandableRow from "@/components/autograder/AutograderExpandableRow";
import AutograderLogBlock from "@/components/autograder/AutograderLogBlock";
import { displayDurationMs } from "@/utils/display";

type AutograderTestResults = {
  suiteResults: SuiteResults;
  publicTests: Tests;
  internal: boolean;
};

// view model for combined SuiteResult and Tests
type SuiteTestLogs = {
  suiteName: string;
  result: SuiteResult;
  tests: Tests[string];
};

function getSuitePassed(suite: SuiteTestLogs) {
  return suite.result.failed === 0;
}

function getSuitePending(suite: SuiteTestLogs) {
  const testsArr = Object.values(suite.tests);
  return testsArr.length > 0 && testsArr.every((test) => test.pending);
}

function getPublicTestLogs(publicTests: Tests, suiteName: string) {
  return publicTests[suiteName] ?? {};
}

function groupSuiteResults(
  suiteResults: SuiteResults,
  publicTests: Tests,
): SuiteTestLogs[] {
  return Object.entries(suiteResults).map(([suiteName, result]) => ({
    suiteName,
    result,
    tests: getPublicTestLogs(publicTests, suiteName),
  }));
}

function SuiteLogDropdown({ suite }: { suite: SuiteTestLogs }) {
  const passed = getSuitePassed(suite);
  const pending = getSuitePending(suite);
  const tests = Object.entries(suite.tests);
  const hasTestLogs = tests.length > 0;
  const suiteStatus = pending ? "Pending" : passed ? "Passed" : "Failed";
  const suiteSummary = `${suite.result.passed}/${suite.result.total} passed · ${suite.result.points}/${suite.result.totalPoints} pts · ${displayDurationMs(suite.result.durationMs)}`;

  const header = (
    <div className="min-w-0 flex-1">
      <p className="text-base font-semibold text-foreground">
        {suite.suiteName}
      </p>
      <p className="text-sm text-muted-foreground">{suiteSummary}</p>
    </div>
  );

  if (!hasTestLogs) {
    return (
      <div className={`flex items-center gap-3 px-5 py-4`}>
        {header}
        <span className="shrink-0 text-xs font-medium text-muted-foreground">
          {suiteStatus}
        </span>
      </div>
    );
  }

  return (
    <details className={`group/suite`} open={true}>
      <summary className="flex cursor-pointer list-none items-center gap-3 px-5 py-4">
        {header}
        <span className="shrink-0 text-xs font-medium text-muted-foreground">
          {suiteStatus}
        </span>
        <ChevronDown className="size-5 shrink-0 text-muted-foreground transition-transform group-open/suite:rotate-180" />
      </summary>

      <div className="border-t bg-blue/5">
        {tests.map(([testName, test]) => (
          <TestLogBlock key={`${suite.suiteName}-${testName}`} test={test} />
        ))}
      </div>
    </details>
  );
}

function TestLogBlock({ test }: { test: TestResult }) {
  const testStatus = test.pending
    ? "Pending"
    : test.passed
      ? "Passed"
      : "Failed";
  const subtitle = `${test.suite} · ${displayDurationMs(test.durationMs)}`;

  if (test.pending) {
    return (
      <AutograderExpandableRow
        className="border-b border-blue/10 bg-gray-100 py-1 px-3 last:border-b-0"
        status="pending"
        rightLabel={testStatus}
        title={test.testName}
      />
    );
  }

  if (test.passed) {
    return (
      <AutograderExpandableRow
        className="border-b border-blue/10 border-l-2 border-l-green-600 bg-green-50/60 py-1 px-3 last:border-b-0"
        status="complete"
        rightLabel={testStatus}
        subtitle={subtitle}
        title={test.testName}
      />
    );
  }

  return (
    <AutograderExpandableRow
      className="border-b border-blue/10 border-l-2 border-l-destructive bg-destructive/10 px-3 py-1 last:border-b-0"
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

export default function AutoGraderTestResults({
  suiteResults,
  publicTests,
  internal,
}: AutograderTestResults) {
  const suiteLogs = groupSuiteResults(suiteResults, publicTests);

  if (suiteLogs.length === 0) {
    return (
      <section className="flex flex-col items-center gap-2 rounded-md border bg-background px-4 py-10 text-center shadow-xs">
        <ClipboardList className="size-6 text-muted-foreground" />
        <p className="font-medium text-foreground">No test suites yet</p>
        <p className="text-sm text-muted-foreground">
          Test results will appear here once the autograder parses the test
          repo.
        </p>
      </section>
    );
  }

  const suitesPassed = suiteLogs.filter(getSuitePassed).length;

  return (
    <section className="overflow-hidden rounded-md border bg-background shadow-xs">
      <div className="flex items-center justify-between gap-3 border-b bg-background px-4 py-3">
        <div>
          <h2 className="text-lg font-semibold text-foreground">
            Test Results
          </h2>
          {!internal && (
            <span className="text-muted-foreground text-sm italic">
              Only showing public tests
            </span>
          )}
        </div>
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
