import { useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { uploadToPublicBucket } from "@/lib/media";
import { cn } from "@/lib/utils";

interface ImageUploadProps {
  value: string | null;
  onChange: (url: string) => void;
  label?: string;
  bucket?: string;
  folder?: string;
  className?: string;
}

/**
 * Combined URL input + file picker that auto-uploads on file select.
 * No separate "Upload" button needed — picking a file immediately uploads it
 * and populates the URL field. The user can also paste a URL directly.
 */
export function ImageUpload({
  value,
  onChange,
  label = "Cover Image",
  bucket = "guide-media",
  folder = "covers",
  className,
}: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadError("");

    try {
      const url = await uploadToPublicBucket(file, bucket, folder);
      onChange(url);
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : "Upload failed.");
    } finally {
      setIsUploading(false);
      // Reset so the same file can be re-selected if needed
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <div className={cn("space-y-2", className)}>
      {label && <Label>{label}</Label>}

      <div className="flex items-center gap-2">
        <Input
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Paste a URL or browse to upload"
          className="flex-1"
        />

        <Button
          type="button"
          variant="outline"
          className="shrink-0"
          disabled={isUploading}
          onClick={() => fileInputRef.current?.click()}
        >
          {isUploading ? (
            <>
              <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
              Uploading…
            </>
          ) : (
            "Browse Upload"
          )}
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="sr-only"
          disabled={isUploading}
          onChange={handleFileChange}
        />
      </div>

      <p className="text-xs text-muted-foreground">Choose a local file to upload, or paste an image URL.</p>

      {uploadError && (
        <p className="text-xs text-red-600">{uploadError}</p>
      )}

      {value && (
        <div className="overflow-hidden rounded-md border bg-muted">
          <img
            src={value}
            alt="Preview"
            className="aspect-[16/9] w-full object-cover"
          />
        </div>
      )}
    </div>
  );
}
