import { useRef, useState } from "react";
import { Eye, Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
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
        <div className="flex items-center gap-2 rounded-md border bg-muted/40 p-2">
          <div className="h-14 w-20 overflow-hidden rounded border bg-muted">
            <img src={value} alt="Preview" className="h-full w-full object-cover" />
          </div>
          <div className="flex items-center gap-1">
            <Button type="button" size="sm" variant="outline" onClick={() => setIsLightboxOpen(true)}>
              <Eye className="mr-1 h-3.5 w-3.5" />
              View
            </Button>
            <Button type="button" size="sm" variant="outline" onClick={() => onChange("")}>
              <Trash2 className="mr-1 h-3.5 w-3.5" />
              Delete
            </Button>
          </div>
        </div>
      )}

      <Dialog open={isLightboxOpen} onOpenChange={setIsLightboxOpen}>
        <DialogContent className="max-w-3xl p-0">
          <DialogHeader className="px-4 pt-4">
            <DialogTitle>{label}</DialogTitle>
          </DialogHeader>
          {value && (
            <div className="px-4 pb-4">
              <img src={value} alt={label} className="max-h-[70vh] w-full rounded-md object-contain" />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
