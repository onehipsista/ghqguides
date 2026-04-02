import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";

interface SimpleRichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
}

const exec = (command: string, value?: string) => {
  document.execCommand(command, false, value);
};

export function SimpleRichTextEditor({ value, onChange }: SimpleRichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!editorRef.current) return;
    if (editorRef.current.innerHTML === value) return;
    editorRef.current.innerHTML = value;
  }, [value]);

  return (
    <div className="rounded-lg border bg-card">
      <div className="flex flex-wrap gap-2 border-b p-2">
        <Button type="button" size="sm" variant="outline" onClick={() => exec("bold")}>Bold</Button>
        <Button type="button" size="sm" variant="outline" onClick={() => exec("italic")}>Italic</Button>
        <Button type="button" size="sm" variant="outline" onClick={() => exec("insertUnorderedList")}>Bullets</Button>
        <Button type="button" size="sm" variant="outline" onClick={() => exec("formatBlock", "blockquote")}>Quote</Button>
      </div>
      <div
        ref={editorRef}
        contentEditable
        className="min-h-[280px] w-full rounded-b-lg bg-background px-3 py-3 text-sm leading-relaxed outline-none"
        onInput={(event) => onChange((event.target as HTMLDivElement).innerHTML)}
      />
    </div>
  );
}
