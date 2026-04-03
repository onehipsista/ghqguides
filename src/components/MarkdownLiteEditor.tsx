import { useMemo } from "react";
import SimpleMDE from "react-simplemde-editor";
import "easymde/dist/easymde.min.css";

interface MarkdownLiteEditorProps {
  value: string;
  onChange: (value: string) => void;
}

const toolbar: SimpleMDE.Options["toolbar"] = [
  "bold",
  "italic",
  "strikethrough",
  "|",
  "heading-1",
  "heading-2",
  "heading-3",
  "|",
  "unordered-list",
  "ordered-list",
  "|",
  "link",
  "image",
  "table",
  "horizontal-rule",
  "|",
  "quote",
  "code",
  "|",
  "preview",
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
      autoDownloadFontAwesome: true,
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
