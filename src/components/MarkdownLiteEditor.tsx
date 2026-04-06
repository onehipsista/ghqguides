import { useMemo } from "react";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";

interface MarkdownLiteEditorProps {
  value: string;
  onChange: (value: string) => void;
}

const looksLikeHtml = (input: string) => /<\/?[a-z][\s\S]*>/i.test(input);

export function MarkdownLiteEditor({ value, onChange }: MarkdownLiteEditorProps) {
  const modules = useMemo(
    () => ({
      toolbar: [
        [{ header: [1, 2, 3, false] }],
        ["bold", "italic", "underline", "strike"],
        [{ list: "ordered" }, { list: "bullet" }],
        ["blockquote", "code-block"],
        ["link", "image"],
        [{ color: [] }, { background: [] }],
        ["clean"],
      ],
    }),
    []
  );

  const formats = useMemo(
    () => [
      "header",
      "bold",
      "italic",
      "underline",
      "strike",
      "list",
      "bullet",
      "blockquote",
      "code-block",
      "link",
      "image",
      "color",
      "background",
    ],
    []
  );

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
      <ReactQuill
        theme="snow"
        value={normalizedValue}
        onChange={(nextValue) => onChange(nextValue ?? "")}
        modules={modules}
        formats={formats}
      />
    </div>
  );
}
