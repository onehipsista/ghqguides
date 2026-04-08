import { useMemo } from "react";
import SimpleMDE from "react-simplemde-editor";
import "easymde/dist/easymde.min.css";

interface MarkdownLiteEditorProps {
  value: string;
  onChange: (value: string) => void;
}

const looksLikeHtml = (input: string) => /<\/?[a-z][\s\S]*>/i.test(input);

export function MarkdownLiteEditor({ value, onChange }: MarkdownLiteEditorProps) {
  const options = useMemo(
    () => ({
      spellChecker: false,
      autofocus: false,
      status: ["lines", "words"],
      toolbar: [
        "bold",
        "italic",
        "heading",
        "|",
        "quote",
        "unordered-list",
        "ordered-list",
        "|",
        "link",
        "image",
        "|",
        "preview",
        "side-by-side",
        "fullscreen",
        "|",
        "guide",
      ],
    }),
    []
  );

  const normalizedValue = useMemo(() => {
    if (!value) return "";
    if (!looksLikeHtml(value)) return value;

    // Very lightweight HTML-to-text fallback for legacy HTML content.
    return value
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/p>\s*<p>/gi, "\n\n")
      .replace(/<[^>]+>/g, "")
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .trim();
  }, [value]);

  return (
    <div className="markdown-lite-editor rounded-lg border bg-card">
      <SimpleMDE
        value={normalizedValue}
        onChange={(nextValue) => onChange(nextValue ?? "")}
        options={options}
      />
    </div>
  );
}
