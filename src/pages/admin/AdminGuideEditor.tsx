import { FormEvent, useEffect, useMemo, useState } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { getAccessState } from "@/lib/access";
import {
  addGuideSection,
  deleteGuideSection,
  exportGuideAsMarkdown,
  getAdminGuideById,
  getGuideArticles,
  getGuideSections,
  moveGuideArticle,
  moveGuideSection,
  saveAdminGuide,
} from "@/lib/admin-guides";
import { GUIDE_AUDIENCE_OPTIONS, GUIDE_CATEGORY_OPTIONS, GUIDE_LEVEL_OPTIONS } from "@/lib/guide-options";
import { ImageUpload } from "@/components/ImageUpload";
import { adminEmailAllowlist } from "@/lib/supabase";

interface GuideFormState {
  title: string;
  slug: string;
  description: string;
  cover_image: string;
  overview_banner_image: string;
  category: string;
  audience_market: string;
  level: string;
  material_symbol: string;
  featured: boolean;
  published: boolean;
}

const DEFAULT_STATE: GuideFormState = {
  title: "",
  slug: "",
  description: "",
  cover_image: "",
  overview_banner_image: "",
  category: GUIDE_CATEGORY_OPTIONS[0],
  audience_market: GUIDE_AUDIENCE_OPTIONS[0],
  level: GUIDE_LEVEL_OPTIONS[0],
  material_symbol: "menu_book",
  featured: false,
  published: false,
};

const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");

const DEFAULT_SECTION_TITLES = [
  "Overview",
  "Getting Started",
  "What to Know",
  "Best Practices",
  "HipTips",
  "Wrap Up",
  "Conclusion",
];

export default function AdminGuideEditorPage() {
  const { id } = useParams();
  const isEditing = Boolean(id);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [form, setForm] = useState<GuideFormState>(DEFAULT_STATE);
  const [newSectionTitle, setNewSectionTitle] = useState("");
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

  const { data: guideData, isLoading: isGuideLoading } = useQuery({
    queryKey: ["admin-guide", id],
    queryFn: () => getAdminGuideById(id as string),
    enabled: isAdmin && isEditing,
  });

  const { data: sections = [] } = useQuery({
    queryKey: ["admin-guide-sections", id],
    queryFn: () => getGuideSections(id as string),
    enabled: isAdmin && isEditing,
  });

  const { data: articles = [] } = useQuery({
    queryKey: ["admin-guide-articles", id],
    queryFn: () => getGuideArticles(id as string),
    enabled: isAdmin && isEditing,
  });

  useEffect(() => {
    if (!guideData) return;

    setForm({
      title: guideData.title,
      slug: guideData.slug,
      description: guideData.description,
      cover_image: guideData.cover_image ?? "",
      overview_banner_image: guideData.overview_banner_image ?? "",
      category: guideData.category ?? GUIDE_CATEGORY_OPTIONS[0],
      audience_market: guideData.audience_market ?? GUIDE_AUDIENCE_OPTIONS[0],
      level: guideData.level ?? GUIDE_LEVEL_OPTIONS[0],
      material_symbol: guideData.material_symbol ?? "menu_book",
      featured: guideData.featured,
      published: guideData.published,
    });
  }, [guideData]);

  const sectionMap = useMemo(() => new Map(sections.map((section) => [section.id, section.title])), [sections]);

  const { mutate: saveGuide, isPending: isSaving } = useMutation({
    mutationFn: () =>
      saveAdminGuide({
        id,
        title: form.title.trim(),
        slug: form.slug.trim(),
        description: form.description.trim(),
        cover_image: form.cover_image.trim() || null,
        overview_banner_image: form.overview_banner_image.trim() || null,
        category: form.category.trim() || null,
        audience_market: form.audience_market.trim() || null,
        level: form.level.trim() || null,
        material_symbol: form.material_symbol.trim() || null,
        featured: form.featured,
        published: form.published,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-guides"] });
      queryClient.invalidateQueries({ queryKey: ["public-guides"] });
      navigate("/admin/guides");
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : "Could not save guide.";
      setErrorMessage(message);
    },
  });

  const { mutate: createSection, isPending: isAddingSection } = useMutation({
    mutationFn: () => addGuideSection(id as string, newSectionTitle.trim()),
    onSuccess: () => {
      setNewSectionTitle("");
      queryClient.invalidateQueries({ queryKey: ["admin-guide-sections", id] });
    },
  });

  const { mutate: addDefaultSections, isPending: isAddingDefaultSections } = useMutation({
    mutationFn: async () => {
      const existing = new Set(sections.map((section) => section.title.trim().toLowerCase()));
      for (const sectionTitle of DEFAULT_SECTION_TITLES) {
        if (existing.has(sectionTitle.toLowerCase())) continue;
        await addGuideSection(id as string, sectionTitle);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-guide-sections", id] });
    },
  });

  const { mutate: removeSection, isPending: isRemovingSection } = useMutation({
    mutationFn: (sectionId: string) => deleteGuideSection(sectionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-guide-sections", id] });
      queryClient.invalidateQueries({ queryKey: ["admin-guide-articles", id] });
    },
  });

  const { mutate: reorderSection, isPending: isReorderingSection } = useMutation({
    mutationFn: ({ sectionId, direction }: { sectionId: string; direction: "up" | "down" }) =>
      moveGuideSection(id as string, sectionId, direction),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-guide-sections", id] });
    },
  });

  const { mutate: reorderArticle, isPending: isReorderingArticle } = useMutation({
    mutationFn: ({ articleId, direction }: { articleId: string; direction: "up" | "down" }) =>
      moveGuideArticle(id as string, articleId, direction),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-guide-articles", id] });
    },
  });

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    setErrorMessage("");

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
    saveGuide();
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
              {isEditing ? "Edit MicroGuide" : "New MicroGuide"}
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {isEditing ? "Update guide details and manage structure." : "Create a new guide."}
            </p>
          </div>
          <Link to="/admin/guides">
            <Button variant="outline">Back</Button>
          </Link>
        </div>

        {isEditing && isGuideLoading && (
          <div className="mb-4 rounded-lg border bg-card p-4 text-sm text-muted-foreground">Loading guide...</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5 rounded-xl border bg-card p-5 sm:p-6">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={form.title}
              onChange={(event) => {
                const value = event.target.value;
                setForm((prev) => ({
                  ...prev,
                  title: value,
                  slug: prev.slug ? prev.slug : slugify(value),
                }));
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
              <Label htmlFor="category">Category</Label>
              <select
                id="category"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={form.category}
                onChange={(event) => setForm((prev) => ({ ...prev, category: event.target.value }))}
              >
                {GUIDE_CATEGORY_OPTIONS.map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="audience_market">Audience / Market</Label>
              <select
                id="audience_market"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={form.audience_market}
                onChange={(event) => setForm((prev) => ({ ...prev, audience_market: event.target.value }))}
              >
                {GUIDE_AUDIENCE_OPTIONS.map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="level">Level</Label>
              <select
                id="level"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={form.level}
                onChange={(event) => setForm((prev) => ({ ...prev, level: event.target.value }))}
              >
                {GUIDE_LEVEL_OPTIONS.map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="material_symbol">Material Symbol</Label>
              <Input
                id="material_symbol"
                value={form.material_symbol}
                onChange={(event) => setForm((prev) => ({ ...prev, material_symbol: event.target.value }))}
                placeholder="menu_book"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              rows={4}
              value={form.description}
              onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
            />
          </div>

          <ImageUpload
            label="Cover Image"
            value={form.cover_image || null}
            onChange={(url) => setForm((prev) => ({ ...prev, cover_image: url }))}
          />

          <ImageUpload
            label="Overview Banner Image (short)"
            value={form.overview_banner_image || null}
            onChange={(url) => setForm((prev) => ({ ...prev, overview_banner_image: url }))}
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.featured}
                onChange={(event) => setForm((prev) => ({ ...prev, featured: event.target.checked }))}
              />
              Featured
            </label>

            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.published}
                onChange={(event) => setForm((prev) => ({ ...prev, published: event.target.checked }))}
              />
              Published
            </label>
          </div>

          {errorMessage && (
            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{errorMessage}</div>
          )}

          <div className="flex flex-wrap gap-3">
            <Button type="submit" disabled={isSaving}>{isSaving ? "Saving..." : "Save Guide"}</Button>
            {isEditing && (
              <Button
                type="button"
                variant="outline"
                onClick={async () => {
                  try {
                    const markdown = await exportGuideAsMarkdown(id as string);
                    const blob = new Blob([markdown], { type: "text/markdown" });
                    const url = URL.createObjectURL(blob);
                    const anchor = document.createElement("a");
                    anchor.href = url;
                    anchor.download = `${form.slug || "guide"}.md`;
                    anchor.click();
                    URL.revokeObjectURL(url);
                  } catch (error) {
                    alert(error instanceof Error ? error.message : "Export failed.");
                  }
                }}
              >
                Export Markdown
              </Button>
            )}
            <Link to="/admin/guides">
              <Button type="button" variant="outline">Cancel</Button>
            </Link>
          </div>
        </form>

        {isEditing && (
          <div className="mt-8 grid gap-6 lg:grid-cols-2">
            <div className="rounded-xl border bg-card p-5">
              <h2 className="font-display text-lg font-semibold">Sections</h2>
              <div className="mt-3 flex gap-2">
                <Input
                  value={newSectionTitle}
                  onChange={(event) => setNewSectionTitle(event.target.value)}
                  placeholder="New section title"
                />
                <Button
                  type="button"
                  disabled={!newSectionTitle.trim() || isAddingSection}
                  onClick={() => createSection()}
                >
                  Add
                </Button>
              </div>

              <div className="mt-2 flex flex-wrap items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={isAddingDefaultSections}
                  onClick={() => addDefaultSections()}
                >
                  Add Default Flow
                </Button>
                {DEFAULT_SECTION_TITLES.map((sectionTitle) => (
                  <Button
                    key={sectionTitle}
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={isAddingSection || isAddingDefaultSections}
                    onClick={() => {
                      setNewSectionTitle(sectionTitle);
                    }}
                  >
                    {sectionTitle}
                  </Button>
                ))}
              </div>

              <ul className="mt-4 space-y-2">
                {sections.length === 0 ? (
                  <li className="text-sm text-muted-foreground">No sections yet.</li>
                ) : (
                  sections.map((section, index) => (
                    <li key={section.id} className="flex items-center justify-between rounded-md border px-3 py-2">
                      <span className="text-sm text-foreground">{section.title}</span>
                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={isReorderingSection || index === 0}
                          onClick={() => reorderSection({ sectionId: section.id, direction: "up" })}
                        >
                          ↑
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={isReorderingSection || index === sections.length - 1}
                          onClick={() => reorderSection({ sectionId: section.id, direction: "down" })}
                        >
                          ↓
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={isRemovingSection}
                          onClick={() => removeSection(section.id)}
                        >
                          Delete
                        </Button>
                      </div>
                    </li>
                  ))
                )}
              </ul>
            </div>

            <div className="rounded-xl border bg-card p-5">
              <div className="flex items-center justify-between gap-3">
                <h2 className="font-display text-lg font-semibold">Articles</h2>
                <Link to={`/admin/articles/new?guideId=${id}`}>
                  <Button size="sm">Add Article</Button>
                </Link>
              </div>

              <ul className="mt-4 space-y-2">
                {articles.length === 0 ? (
                  <li className="text-sm text-muted-foreground">No articles yet.</li>
                ) : (
                  articles.map((article, index) => (
                    <li key={article.id} className="rounded-md border px-3 py-2">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-medium text-foreground">{article.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {article.section_id ? (
                              sectionMap.get(article.section_id) ?? "Unknown section"
                            ) : (
                              <span className="font-medium text-red-600">No section</span>
                            )}
                            {" • "}
                            {article.published ? "Published" : "Draft"}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={isReorderingArticle || index === 0}
                            onClick={() => reorderArticle({ articleId: article.id, direction: "up" })}
                          >
                            ↑
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={isReorderingArticle || index === articles.length - 1}
                            onClick={() => reorderArticle({ articleId: article.id, direction: "down" })}
                          >
                            ↓
                          </Button>
                          <Link to={`/admin/articles/${article.id}`}>
                            <Button variant="outline" size="sm">Edit</Button>
                          </Link>
                        </div>
                      </div>
                    </li>
                  ))
                )}
              </ul>
            </div>
          </div>
        )}
      </section>
    </Layout>
  );
}
