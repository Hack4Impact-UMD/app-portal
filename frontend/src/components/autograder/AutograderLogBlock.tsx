import Ansi from "ansi-to-react";

type AutograderLogBlockProps = {
  output: string;
};

export default function AutograderLogBlock({
  output,
}: AutograderLogBlockProps) {
  if (!output) return null;

  return (
    <pre className="whitespace-pre-wrap rounded-md border border-slate-200 bg-slate-50 px-3 py-2 font-mono text-xs leading-5 text-foreground">
      <Ansi>{output}</Ansi>
    </pre>
  );
}
