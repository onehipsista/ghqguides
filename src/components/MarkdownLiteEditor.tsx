import { useMemo } from "react";
import { SimpleRichTextEditor } from "@/components/SimpleRichTextEditor";

interface MarkdownLiteEditorProps {
  value: string;
  onChange: (value: string) => void;
}

const looksLikeHtml = (input: string) => /<\/?[a-z][\s\S]*>/i.test(input);

export function MarkdownLiteEditor({ value, onChange }: MarkdownLiteEditorProps) {
  const normalizedValue = useMemo(() => {
    if (!value) return "";
    if (looksLikeHtml(value)) return value;

    // If old markdown/plain text exists, preserve readability by converting
    // newlines to paragraphs/line-breaks for Quill editing.
    const escaped = value
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

    return escaped
      .split(/\n\n+/)
      .map((block) => `<p>${block.replace(/\n/g, "<br/>")}</p>`)
      .join("");
  }, [value]);

  return (
    <div className="markdown-lite-editor rounded-lg border bg-card">
      <SimpleRichTextEditor value={normalizedValue} onChange={(nextValue) => onChange(nextValue ?? "")} />
    </div>
  );
}
