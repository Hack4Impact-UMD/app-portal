import type { ApplicantRole } from "@app-portal/shared/constants";
import { keepPreviousData, skipToken, useQuery } from "@tanstack/react-query";

import { trpc } from "@/config/trpc";
import type { RouterOutputs } from "@/types/trpc";
import type { CsvRow } from "@/types/types";

export type QualifiedAppRow = RouterOutputs["rows"]["qualified"][number];

export const qualifiedRowsQueryRoot = trpc.rows.qualified.pathKey();

export function qualifiedRowsQueryOptions(formId: string) {
  return trpc.rows.qualified.queryOptions(
    { formId },
    { placeholderData: keepPreviousData, refetchOnWindowFocus: true },
  );
}

export function useRows(formId: string | undefined) {
  return useQuery(
    formId
      ? qualifiedRowsQueryOptions(formId)
      : trpc.rows.qualified.queryOptions(skipToken),
  );
}

export function flattenRows(
  rows: QualifiedAppRow[],
  role: ApplicantRole | "all",
): CsvRow[] {
  const filteredRows =
    role === "all" ? rows : rows.filter((row) => row.role === role);

  if (filteredRows.length === 0) return [];

  // Roles can have different interview criteria, so take the union of keys
  // across every submitted interview: CSV headers come from the first row, so
  // every row has to carry the same set of keys.
  const allSubmitted = filteredRows.flatMap((r) =>
    r.interviews.filter((i) => i.submitted),
  );
  const scoreKeys = [
    ...new Set(allSubmitted.flatMap((i) => Object.keys(i.interviewScores))),
  ].sort();
  const noteKeys = [
    ...new Set(allSubmitted.flatMap((i) => Object.keys(i.interviewerNotes))),
  ].sort();

  return filteredRows.map((row) => {
    const flat: CsvRow = {
      Name: row.name,
      Role: row.role,
      "Average Review Score": row.averageReviewScore ?? "",
      "Average Interview Score": row.averageScore ?? "",
      "Best Autograder Score": row.bestGradingScore ?? "",
    };

    const submittedInterviews = row.interviews.filter((i) => i.submitted);

    for (let i = 0; i < 2; i++) {
      const interview = submittedInterviews[i];
      const n = i + 1;

      if (interview && row.individualScores[i] !== undefined) {
        flat[`Interview ${n} - Overall Score`] = row.individualScores[i];
        scoreKeys.forEach((key) => {
          flat[`Interview ${n} - ${key}`] =
            interview.interviewScores[key] ?? "";
        });
        noteKeys.forEach((key) => {
          flat[`Interview ${n} Notes - ${key}`] =
            interview.interviewerNotes[key] ?? "";
        });
      } else {
        flat[`Interview ${n} - Overall Score`] = "";
        scoreKeys.forEach((key) => {
          flat[`Interview ${n} - ${key}`] = "";
        });
        noteKeys.forEach((key) => {
          flat[`Interview ${n} Notes - ${key}`] = "";
        });
      }
    }

    return flat;
  });
}
