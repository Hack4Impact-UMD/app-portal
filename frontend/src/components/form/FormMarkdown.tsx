import { memo, useMemo } from "react";
import type { Options } from "react-markdown";
import Markdown from "react-markdown";
import { twMerge } from "tailwind-merge";

function FormMarkdown({
  children,
  components,
  className = "",
}: Options & { className?: string }) {
  const md = useMemo(
    () => (
      <Markdown
        components={{
          a: (opts) => (
            <a
              className="underline text-blue"
              href={opts.href}
              target="_blank"
              rel="noopener noreferrer"
            >
              {opts.children}
            </a>
          ),
          ul: (opts) => (
            <ul className="list-disc list-inside">{opts.children}</ul>
          ),
          ol: (opts) => (
            <ol className="list-decimal list-inside">{opts.children}</ol>
          ),
          ...components,
        }}
      >
        {children}
      </Markdown>
    ),
    [children, components],
  );

  if (!children) return <></>;

  return (
    <div
      className={twMerge(
        "mb-2.5 prose text-muted-foreground max-w-none leading-snug prose-li:m-0",
        className,
      )}
    >
      {md}
    </div>
  );
}

export default memo(FormMarkdown);
