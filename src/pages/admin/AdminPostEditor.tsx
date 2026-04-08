import { FormEvent, useEffect, useMemo, useState } from "react";
import { Link, Navigate, useLocation, useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { MarkdownLiteEditor } from "@/components/MarkdownLiteEditor";
import { ImageUpload } from "@/components/ImageUpload";
import { getAccessState } from "@/lib/access";
import { adminEmailAllowlist } from "@/lib/supabase";
import { getAdminPostById, saveAdminPost } from "@/lib/admin-posts";
import { BLOG_CATEGORY_DEFAULT, BLOG_TAXONOMY } from "@/lib/blog-taxonomy";
import { estimateReadingTimeMinutes } from "@/lib/guide-options";

const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");

interface PostFormState {
  title: string;
  slug: string;
  excerpt: string;
  tldr: string;
  content: string;
  cover_image: string;
  author: string;
  category: string;
  extra_categories_csv: string;
  tags_csv: string;
  status: "draft" | "published";
  reading_time_minutes: string;
  reading_time_mode: "auto" | "manual";
  published_at: string;
  order_index: string;
}

const DEFAULT_STATE: PostFormState = {
  title: "",
  slug: "",
  excerpt: "",
  tldr: "",
  content: "",
  cover_image: "",
  author: "OneHipSista",
  category: BLOG_CATEGORY_DEFAULT,
  extra_categories_csv: "",
  tags_csv: "",
  status: "draft",
  reading_time_minutes: "1",
  reading_time_mode: "auto",
  published_at: "",
  order_index: "0",
};

const splitStoredCategories = (value: string | null | undefined): string[] => {
  if (!value) return [];
  return value
    .split(/[|,]/)
    .map((entry) => entry.trim())
    .filter(Boolean);
};

export default function AdminPostEditorPage() {
  const { id } = useParams();
  const isEditing = Boolean(id);
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [form, setForm] = useState<PostFormState>(DEFAULT_STATE);
  const [errorMessage, setErrorMessage] = useState("");

  const { data: accessState, isLoading: isAccessLoading } = useQuery({
    queryKey: ["access-state"],
    queryFn: getAccessState,
  });

  const isAdmin =
    accessState?.role === "admin" ||
    Boolean(accessState?.email && adminEmailAllowlist.includes(accessState.email.toLowerCase()));

  const { data: postData, isLoading: isPostLoading } = useQuery({
    queryKey: ["admin-post", id],
    queryFn: () => getAdminPostById(id as string),
    enabled: isAdmin && isEditing,
  });

  useEffect(() => {
    if (!postData) return;
    const categories = splitStoredCategories(postData.category);
    setForm({
      title: postData.title,
      slug: postData.slug,
      excerpt: postData.excerpt,
      tldr: postData.tldr ?? "",
      content: postData.content,
      cover_image: postData.cover_image ?? "",
      author: postData.author ?? "OneHipSista",
      category: categories[0] ?? BLOG_CATEGORY_DEFAULT,
      extra_categories_csv: categories.slice(1).join(", "),
      tags_csv: postData.tags.join(", "),
      status: postData.status,
      reading_time_minutes: String(postData.reading_time_minutes ?? 1),
      reading_time_mode: "manual",
      published_at: postData.published_at ? postData.published_at.slice(0, 10) : "",
      order_index: String(postData.order_index ?? 0),
    });
  }, [postData]);

  const autoReadingTime = useMemo(
    () => estimateReadingTimeMinutes(form.content),
    [form.content]
  );

  const effectiveReadingTime =
    form.reading_time_mode === "auto"
      ? autoReadingTime
      : Math.max(1, Number(form.reading_time_minutes || 1));

  const { mutate: save, isPending: isSaving } = useMutation({
    mutationFn: () => {
      const extraCategories = form.extra_categories_csv
        .split(",")
        .map((entry) => entry.trim())
        .filter(Boolean);

      const combinedCategories = Array.from(new Set([form.category.trim(), ...extraCategories].filter(Boolean)));

      return saveAdminPost({
        id,
        title: form.title.trim(),
        slug: form.slug.trim(),
        excerpt: form.excerpt.trim(),
        tldr: form.tldr.trim() || null,
        content: form.content.trim(),
        cover_image: form.cover_image.trim() || null,
        author: form.author.trim() || null,
        category: combinedCategories.length > 0 ? combinedCategories.join(" | ") : null,
        tags: form.tags_csv
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
        status: form.status,
        reading_time_minutes: effectiveReadingTime,
        published_at: form.published_at ? new Date(form.published_at).toISOString() : null,
        order_index: Number(form.order_index || 0),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-posts"] });
      queryClient.invalidateQueries({ queryKey: ["public-posts"] });
      navigate("/admin/blog");
    },
    onError: (error: unknown) => {
      const fallback = "Could not save post.";
      const message =
        error instanceof Error
          ? error.message
          : typeof error === "object" && error && "message" in error
            ? String((error as { message?: unknown }).message ?? fallback)
            : fallback;
      setErrorMessage(message);
    },
  });

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    setErrorMessage("");
    if (!form.title.trim()) { setErrorMessage("Title is required."); return; }
    const nextSlug = form.slug.trim() || slugify(form.title);
    setForm((prev) => ({ ...prev, slug: nextSlug }));
    save();
  };

  if (!isAccessLoading && !isAdmin) {
    return (
      <Navigate
        to="/login"
        state={{ from: `${location.pathname}${location.search}${location.hash}` }}
        replace
      />
    );
  }

  return (
    <Layout>
      <section className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-center justify-between gap-3">
          <div>
            <h1 className="font-display text-2xl font-bold text-foreground">
              {isEditing ? "Edit Post" : "New Blog Post"}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Reading time: <strong>{effectiveReadingTime} min</strong>
            </p>
          </div>
          <Link to="/admin/blog">
            <Button variant="outline">Back</Button>
          </Link>
        </div>

        {isEditing && isPostLoading && (
          <div className="mb-4 rounded-lg border bg-card p-4 text-sm text-muted-foreground">Loading post...</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5 rounded-xl border bg-card p-5 sm:p-6">

          {/* Title + Slug */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={form.title}
                onChange={(e) => {
                  const value = e.target.value;
                  setForm((prev) => ({
                    ...prev,
                    title: value,
                    slug: prev.slug ? prev.slug : slugify(value),
                  }));
                }}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="slug">Slug</Label>
              <Input
                id="slug"
                value={form.slug}
                onChange={(e) => setForm((prev) => ({ ...prev, slug: slugify(e.target.value) }))}
                required
              />
            </div>
          </div>

          {/* Category + Author */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <select
                id="category"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={form.category}
                onChange={(e) => setForm((prev) => ({ ...prev, category: e.target.value }))}
              >
                {BLOG_TAXONOMY.map((group) => (
                  <optgroup key={group.label} label={group.label}>
                    {group.values.map((value) => (
                      <option key={value} value={value}>{value}</option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="extra_categories">Additional Categories</Label>
              <Input
                id="extra_categories"
                placeholder="Optional, comma separated"
                value={form.extra_categories_csv}
                onChange={(e) => setForm((prev) => ({ ...prev, extra_categories_csv: e.target.value }))}
              />
              <p className="text-xs text-muted-foreground">Example: Marketing, AI</p>
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="author">Author</Label>
              <Input
                id="author"
                placeholder="OneHipSista"
                value={form.author}
                onChange={(e) => setForm((prev) => ({ ...prev, author: e.target.value }))}
              />
            </div>
          </div>

          {/* Status + Published Date */}
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <select
                id="status"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={form.status}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, status: e.target.value as "draft" | "published" }))
                }
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="published_at">Published Date</Label>
              <Input
                id="published_at"
                type="date"
                value={form.published_at}
                onChange={(e) => setForm((prev) => ({ ...prev, published_at: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="order_index">Order Index</Label>
              <Input
                id="order_index"
                type="number"
                min={0}
                value={form.order_index}
                onChange={(e) => setForm((prev) => ({ ...prev, order_index: e.target.value }))}
              />
            </div>
          </div>

          {/* Reading time controls */}
          <div className="grid gap-4 sm:grid-cols-3">
            <label className="flex items-center gap-2 text-sm sm:col-span-1">
              <input
                type="checkbox"
                checked={form.reading_time_mode === "auto"}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    reading_time_mode: event.target.checked ? "auto" : "manual",
                    reading_time_minutes: String(autoReadingTime),
                  }))
                }
              />
              Auto-calculate reading time
            </label>

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="reading_time_minutes">Reading Time (minutes)</Label>
              <Input
                id="reading_time_minutes"
                type="number"
                min={1}
                value={form.reading_time_mode === "auto" ? autoReadingTime : form.reading_time_minutes}
                disabled={form.reading_time_mode === "auto"}
                onChange={(e) => setForm((prev) => ({ ...prev, reading_time_minutes: e.target.value }))}
              />
            </div>
          </div>

          {/* Excerpt */}
          <div className="space-y-2">
            <Label htmlFor="excerpt">Excerpt</Label>
            <Textarea
              id="excerpt"
              rows={2}
              placeholder="Short summary shown on the blog listing..."
              value={form.excerpt}
              onChange={(e) => setForm((prev) => ({ ...prev, excerpt: e.target.value }))}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="tldr">TLDR</Label>
            <Textarea
              id="tldr"
              rows={2}
              placeholder="Quick takeaway shown above the article content..."
              value={form.tldr}
              onChange={(e) => setForm((prev) => ({ ...prev, tldr: e.target.value }))}
            />
          </div>

          {/* Cover image */}
          <ImageUpload
            label="Cover Image"
            value={form.cover_image || null}
            onChange={(url) => setForm((prev) => ({ ...prev, cover_image: url }))}
          />

          {/* Tags */}
          <div className="space-y-2">
            <Label htmlFor="tags">Tags (comma separated)</Label>
            <Input
              id="tags"
              placeholder="design, canva, typography"
              value={form.tags_csv}
              onChange={(e) => setForm((prev) => ({ ...prev, tags_csv: e.target.value }))}
            />
          </div>

          {/* Content editor */}
          <div className="space-y-2">
            <Label>
              Content
              <span className="ml-2 font-normal text-muted-foreground">
                — {effectiveReadingTime} min read
              </span>
            </Label>
            <MarkdownLiteEditor
              value={form.content}
              onChange={(value) => setForm((prev) => ({ ...prev, content: value }))}
            />
          </div>

          {errorMessage && (
            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {errorMessage}
            </div>
          )}

          <div className="flex gap-3">
            <Button type="submit" disabled={isSaving}>
              {isSaving ? "Saving..." : "Save Post"}
            </Button>
            <Link to="/admin/blog">
              <Button type="button" variant="outline">Cancel</Button>
            </Link>
          </div>
        </form>
      </section>
    </Layout>
  );
}
