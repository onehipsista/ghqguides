import { useMemo } from "react";
import SimpleMDE from "react-simplemde-editor";
import "easymde/dist/easymde.min.css";

interface MarkdownLiteEditorProps {
  value: string;
  onChange: (value: string) => void;
}

const toolbar = [
  "bold",
  "italic",
  "unordered-list",
  "quote",
  "code",
  "code-block",
  "|",
  "preview",
  "guide",
];

export function MarkdownLiteEditor({ value, onChange }: MarkdownLiteEditorProps) {
  const options = useMemo(
    () => ({
      spellChecker: false,
      status: ["lines", "words"],
      toolbar,
      autofocus: false,
      minHeight: "280px",
      placeholder: "Write article content...",
      autoDownloadFontAwesome: false,
    }),
    []
  );

  return (
    <div className="markdown-lite-editor">
      <SimpleMDE
        value={value}
        onChange={(nextValue) => onChange(nextValue ?? "")}
        options={options}
      />
    </div>
  );
}
