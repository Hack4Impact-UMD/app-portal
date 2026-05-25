import CharacterCount from "@tiptap/extension-character-count";
import Placeholder from "@tiptap/extension-placeholder";
import Underline from "@tiptap/extension-underline";
import { Markdown } from "@tiptap/markdown";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { useEffect } from "react";

import { cn } from "@/lib/utils";

interface RichTextareaProps {
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  onWordCountChange?: (count: number) => void;
}

function RichTextarea({
  value,
  onChange,
  placeholder = "",
  disabled = false,
  className,
  onWordCountChange,
}: RichTextareaProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Placeholder.configure({ placeholder }),
      CharacterCount,
      Markdown,
    ],
    content: value,
    editorProps: {
      attributes: {
        class: "outline-none min-h-[inherit] h-full",
      },
    },
    editable: !disabled,
    onUpdate: ({ editor }) => {
      const markdown = editor.getMarkdown();
      onChange(markdown);

      if (onWordCountChange) {
        onWordCountChange(editor.storage.characterCount.words());
      }
    },
  });

  useEffect(() => {
    if (editor && value !== editor.getMarkdown()) {
      editor.commands.setContent(value ?? "", {
        emitUpdate: false,
        contentType: "markdown",
      });
    }
  }, [value, editor]);

  useEffect(() => {
    if (editor) {
      editor.setEditable(!disabled);
    }
  }, [disabled, editor]);

  useEffect(() => {
    if (editor && onWordCountChange) {
      onWordCountChange(editor.storage.characterCount.words());
    }
  }, [editor, onWordCountChange]);

  return (
    <EditorContent
      editor={editor}
      className={cn(
        "prose prose-sm max-w-none leading-tight",
        "prose-headings:mt-0 prose-headings:mb-0 prose-p:my-0",
        "p-2 min-h-32 w-full rounded-md border-2 bg-white",
        "focus-within:ring-2 focus-within:ring-ring focus-within:border-ring",
        "transition-[color,box-shadow]",
        "[&_.tiptap]:outline-none [&_.tiptap]:min-h-[inherit]",
        "[&_.tiptap_p.is-editor-empty:first-child]:before:content-[attr(data-placeholder)]",
        "[&_.tiptap_p.is-editor-empty:first-child]:before:text-muted-foreground",
        "[&_.tiptap_p.is-editor-empty:first-child]:before:float-left",
        "[&_.tiptap_p.is-editor-empty:first-child]:before:h-0",
        "[&_.tiptap_p.is-editor-empty:first-child]:before:pointer-events-none",
        disabled && "opacity-100 bg-[#f3f4f6] cursor-not-allowed",
        className,
      )}
    />
  );
}

export { RichTextarea };
