import { supabase } from "@/lib/supabase";

const GUIDE_MEDIA_BUCKET = "guide-media";

export const getVersionedMediaUrl = (url: string | null | undefined, version?: string | null): string => {
  if (!url) return "";

  if (!version) return url;

  try {
    const nextUrl = new URL(url);
    nextUrl.searchParams.set("v", version);
    return nextUrl.toString();
  } catch {
    const separator = url.includes("?") ? "&" : "?";
    return `${url}${separator}v=${encodeURIComponent(version)}`;
  }
};

export const uploadGuideCover = async (file: File): Promise<string> => {
  if (!supabase) {
    throw new Error("Supabase is not configured.");
  }

  const extension = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
  const fileName = `${crypto.randomUUID()}.${extension}`;
  const filePath = `covers/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from(GUIDE_MEDIA_BUCKET)
    .upload(filePath, file, {
      upsert: false,
      contentType: file.type || undefined,
    });

  if (uploadError) {
    throw new Error(uploadError.message);
  }

  const { data } = supabase.storage.from(GUIDE_MEDIA_BUCKET).getPublicUrl(filePath);
  if (!data?.publicUrl) {
    throw new Error("Could not generate public URL for uploaded file.");
  }

  return data.publicUrl;
};
