import Ansi from "ansi-to-react";

type AutograderLogBlockProps = {
  output: string;
  label?: string;
};

export default function AutograderLogBlock({
  output,
  label,
}: AutograderLogBlockProps) {
  if (!output) return null;

  return (
    <div>
      {label && (
        <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {label}
        </p>
      )}
      <pre className="whitespace-pre-wrap rounded-md border border-slate-200 bg-slate-50 px-3 py-2 font-mono text-xs leading-5 text-foreground">
        <Ansi>{output}</Ansi>
      </pre>
    </div>
  );
}
