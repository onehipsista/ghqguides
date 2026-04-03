import { FormEvent, useEffect, useMemo, useState } from "react";
import { Link, Navigate, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { MarkdownLiteEditor } from "@/components/MarkdownLiteEditor";
import { getAccessState } from "@/lib/access";
import { estimateReadingTimeMinutes } from "@/lib/guide-options";
import {
  getAdminArticleById,
  getAdminGuides,
  getGuideSections,
  saveAdminArticle,
} from "@/lib/admin-guides";
import { adminEmailAllowlist } from "@/lib/supabase";

const DEFAULT_FORM = {
  guide_id: "",
  section_id: "",
  title: "",
  slug: "",
  synopsis: "",
  content: "",
  reading_time_minutes: 1,
  order_index: 0,
  published: false,
};

const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");

export default function AdminArticleEditorPage() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const guideIdParam = searchParams.get("guideId") ?? "";
  const isEditing = Boolean(id);

  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [form, setForm] = useState(DEFAULT_FORM);
  const [errorMessage, setErrorMessage] = useState("");

  const { data: accessState, isLoading: isAccessLoading } = useQuery({
    queryKey: ["access-state"],
    queryFn: getAccessState,
  });

  const isAdminByRole = accessState?.role === "admin";
  const isAdminByAllowlist = Boolean(
    accessState?.email && adminEmailAllowlist.includes(accessState.email.toLowerCase())
  );
  const isAdmin = isAdminByRole || isAdminByAllowlist;

  const { data: guides = [] } = useQuery({
    queryKey: ["admin-guides"],
    queryFn: getAdminGuides,
    enabled: isAdmin,
  });

  const { data: articleData } = useQuery({
    queryKey: ["admin-article", id],
    queryFn: () => getAdminArticleById(id as string),
    enabled: isAdmin && isEditing,
  });

  const activeGuideId = form.guide_id || guideIdParam;

  const { data: sections = [] } = useQuery({
    queryKey: ["admin-guide-sections", activeGuideId],
    queryFn: () => getGuideSections(activeGuideId),
    enabled: isAdmin && Boolean(activeGuideId),
  });

  useEffect(() => {
    if (isEditing) return;
    if (guideIdParam) {
      setForm((prev) => ({ ...prev, guide_id: guideIdParam }));
    }
  }, [guideIdParam, isEditing]);

  useEffect(() => {
    if (!articleData) return;

    setForm({
      guide_id: articleData.guide_id,
      section_id: articleData.section_id ?? "",
      title: articleData.title,
      slug: articleData.slug,
      synopsis: articleData.synopsis ?? "",
      content: articleData.content ?? "",
      reading_time_minutes: articleData.reading_time_minutes ?? estimateReadingTimeMinutes(articleData.content ?? ""),
      order_index: articleData.order_index,
      published: articleData.published,
    });
  }, [articleData]);

  const selectedGuideTitle = useMemo(
    () => guides.find((guide) => guide.id === form.guide_id)?.title,
    [guides, form.guide_id]
  );

  const { mutate: saveArticle, isPending: isSaving } = useMutation({
    mutationFn: () =>
      saveAdminArticle({
        id,
        guide_id: form.guide_id,
        section_id: form.section_id || null,
        title: form.title.trim(),
        slug: form.slug.trim(),
        synopsis: form.synopsis.trim(),
        content: form.content,
        reading_time_minutes: Number(form.reading_time_minutes) || estimateReadingTimeMinutes(form.content),
        order_index: Number(form.order_index) || 0,
        published: form.published,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-guide-articles", form.guide_id] });
      queryClient.invalidateQueries({ queryKey: ["guide-overview"] });
      queryClient.invalidateQueries({ queryKey: ["guide-article"] });
      if (form.guide_id) {
        navigate(`/admin/guides/${form.guide_id}`);
        return;
      }
      navigate("/admin/guides");
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : "Could not save article.";
      setErrorMessage(message);
    },
  });

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    setErrorMessage("");

    if (!form.guide_id) {
      setErrorMessage("Guide is required.");
      return;
    }

    if (!form.title.trim()) {
      setErrorMessage("Title is required.");
      return;
    }

    const nextSlug = form.slug.trim() || slugify(form.title);
    if (!nextSlug) {
      setErrorMessage("Slug is required.");
      return;
    }

    setForm((prev) => ({ ...prev, slug: nextSlug }));
    saveArticle();
  };

  if (!isAccessLoading && !isAdmin) {
    return <Navigate to="/admin/guides" replace />;
  }

  return (
    <Layout>
      <section className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-center justify-between gap-3">
          <div>
            <h1 className="font-display text-2xl font-bold text-foreground">
              {isEditing ? "Edit Article" : "New Article"}
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {selectedGuideTitle ? `Guide: ${selectedGuideTitle}` : "Create article content and publish when ready."}
            </p>
          </div>
          <Link to={form.guide_id ? `/admin/guides/${form.guide_id}` : "/admin/guides"}>
            <Button variant="outline">Back</Button>
          </Link>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 rounded-xl border bg-card p-5 sm:p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="guide_id">Guide</Label>
              <select
                id="guide_id"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={form.guide_id}
                onChange={(event) => setForm((prev) => ({ ...prev, guide_id: event.target.value, section_id: "" }))}
                required
              >
                <option value="">Select a guide</option>
                {guides.map((guide) => (
                  <option key={guide.id} value={guide.id}>{guide.title}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="section_id">Section (optional)</Label>
              <select
                id="section_id"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={form.section_id}
                onChange={(event) => setForm((prev) => ({ ...prev, section_id: event.target.value }))}
              >
                <option value="">No section</option>
                {sections.map((section) => (
                  <option key={section.id} value={section.id}>{section.title}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={form.title}
              onChange={(event) => {
                const value = event.target.value;
                setForm((prev) => ({ ...prev, title: value, slug: prev.slug ? prev.slug : slugify(value) }));
              }}
              required
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="slug">Slug</Label>
              <Input
                id="slug"
                value={form.slug}
                onChange={(event) => setForm((prev) => ({ ...prev, slug: slugify(event.target.value) }))}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="order_index">Order index</Label>
              <Input
                id="order_index"
                type="number"
                value={form.order_index}
                onChange={(event) => setForm((prev) => ({ ...prev, order_index: Number(event.target.value) || 0 }))}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="synopsis">Synopsis / TLDR</Label>
            <Textarea
              id="synopsis"
              rows={3}
              value={form.synopsis}
              onChange={(event) => setForm((prev) => ({ ...prev, synopsis: event.target.value }))}
              placeholder="A short summary shown at the top of the article."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="content">Content</Label>
            <MarkdownLiteEditor
              value={form.content}
              onChange={(nextValue) =>
                setForm((prev) => ({
                  ...prev,
                  content: nextValue,
                }))
              }
            />
          </div>

          <div className="space-y-2 sm:max-w-[220px]">
            <Label htmlFor="reading_time_minutes">Reading time (minutes)</Label>
            <Input
              id="reading_time_minutes"
              type="number"
              min={1}
              value={form.reading_time_minutes}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  reading_time_minutes: Math.max(1, Number(event.target.value) || 1),
                }))
              }
            />
          </div>

          {isEditing && articleData && (
            <div className="grid gap-4 rounded-md border border-border/60 bg-muted/30 px-4 py-3 text-sm sm:grid-cols-2">
              <div>
                <span className="font-medium text-muted-foreground">Created: </span>
                <span className="text-foreground">
                  {articleData.created_at
                    ? new Date(articleData.created_at).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })
                    : "—"}
                </span>
              </div>
              <div>
                <span className="font-medium text-muted-foreground">Last Updated: </span>
                <span className="text-foreground">
                  {articleData.updated_at
                    ? new Date(articleData.updated_at).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })
                    : "—"}
                </span>
              </div>
            </div>
          )}

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.published}
              onChange={(event) => setForm((prev) => ({ ...prev, published: event.target.checked }))}
            />
            Published
          </label>

          {errorMessage && (
            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{errorMessage}</div>
          )}

          <div className="flex gap-3">
            <Button type="submit" disabled={isSaving}>{isSaving ? "Saving..." : "Save Article"}</Button>
            <Link to={form.guide_id ? `/admin/guides/${form.guide_id}` : "/admin/guides"}>
              <Button type="button" variant="outline">Cancel</Button>
            </Link>
          </div>
        </form>
      </section>
    </Layout>
  );
}
