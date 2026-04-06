import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Eye, OctagonMinus, Pencil, Sparkles, Upload } from "lucide-react";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { getAccessState } from "@/lib/access";
import { getAdminGuides, setGuideFeatured, setGuidePublished, swapGuideOrder } from "@/lib/admin-guides";
import { getVersionedMediaUrl } from "@/lib/media";
import { adminEmailAllowlist } from "@/lib/supabase";

type SortOption = "updated" | "title" | "category";
type ViewMode = "list" | "cards";

export default function AdminGuidesPage() {
  const queryClient = useQueryClient();
  const [sortBy, setSortBy] = useState<SortOption>("updated");
  const [viewMode, setViewMode] = useState<ViewMode>("cards");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [draggedGuideId, setDraggedGuideId] = useState<string | null>(null);

  const { data: accessState, isLoading: isAccessLoading } = useQuery({
    queryKey: ["access-state"],
    queryFn: getAccessState,
  });

  const isAdminByRole = accessState?.role === "admin";
  const isAdminByAllowlist = Boolean(
    accessState?.email && adminEmailAllowlist.includes(accessState.email.toLowerCase())
  );
  const isAdmin = isAdminByRole || isAdminByAllowlist;

  const { data: guides = [], isLoading, isError } = useQuery({
    queryKey: ["admin-guides"],
    queryFn: getAdminGuides,
    enabled: isAdmin,
  });

  const { mutate: togglePublished, isPending: isPublishing } = useMutation({
    mutationFn: ({ guideId, published }: { guideId: string; published: boolean }) =>
      setGuidePublished(guideId, published),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-guides"] });
      queryClient.invalidateQueries({ queryKey: ["public-guides"] });
    },
  });

  const { mutate: toggleFeatured, isPending: isFeaturing } = useMutation({
    mutationFn: ({ guideId, featured }: { guideId: string; featured: boolean }) =>
      setGuideFeatured(guideId, featured),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-guides"] });
      queryClient.invalidateQueries({ queryKey: ["public-guides"] });
    },
  });

  const { mutate: reorderGuide, isPending: isReorderingGuide } = useMutation({
    mutationFn: ({ sourceGuideId, targetGuideId }: { sourceGuideId: string; targetGuideId: string }) =>
      swapGuideOrder(sourceGuideId, targetGuideId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-guides"] });
      queryClient.invalidateQueries({ queryKey: ["public-guides"] });
    },
  });

  const categories = useMemo(
    () => Array.from(new Set(guides.map((guide) => guide.category).filter(Boolean))).sort(),
    [guides]
  );

  const visibleGuides = useMemo(() => {
    const filtered = guides.filter((guide) => {
      if (categoryFilter === "all") return true;
      return (guide.category ?? "") === categoryFilter;
    });

    if (viewMode === "cards") {
      return filtered;
    }

    return [...filtered].sort((left, right) => {
      if (sortBy === "title") {
        return left.title.localeCompare(right.title);
      }

      if (sortBy === "category") {
        return (left.category ?? "").localeCompare(right.category ?? "") || left.title.localeCompare(right.title);
      }

      return new Date(right.updated_at ?? 0).getTime() - new Date(left.updated_at ?? 0).getTime();
    });
  }, [categoryFilter, guides, sortBy, viewMode]);

  return (
    <Layout>
      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <h1 className="font-display text-2xl font-bold text-foreground">Admin — Guides</h1>
        <p className="mt-2 text-sm text-muted-foreground">Create and manage guide metadata and visibility.</p>

        <div className="mt-3 inline-flex flex-wrap items-center gap-2 rounded-md border bg-card p-1">
          <Link to="/admin/guides">
            <Button size="sm" variant="outline">Guides</Button>
          </Link>
          <Link to="/admin/articles/new">
            <Button size="sm" variant="outline">Articles</Button>
          </Link>
          <Link to="/admin/categories">
            <Button size="sm" variant="outline">Categories</Button>
          </Link>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <Link to="/admin/guides/new">
            <Button>Add New Guide</Button>
          </Link>

          <select
            className="h-10 rounded-md border border-input bg-background px-3 text-sm"
            value={sortBy}
            onChange={(event) => setSortBy(event.target.value as SortOption)}
          >
            <option value="updated">Sort: Recently updated</option>
            <option value="title">Sort: Title A–Z</option>
            <option value="category">Sort: Category</option>
          </select>

          <select
            className="h-10 rounded-md border border-input bg-background px-3 text-sm"
            value={categoryFilter}
            onChange={(event) => setCategoryFilter(event.target.value)}
          >
            <option value="all">All categories</option>
            {categories.map((category) => (
              <option key={category} value={category ?? ""}>{category}</option>
            ))}
          </select>

          <div className="inline-flex rounded-md border bg-background p-1">
            <button
              type="button"
              onClick={() => setViewMode("list")}
              className={`rounded px-3 py-1 text-sm ${viewMode === "list" ? "bg-brand-green text-white" : "text-foreground/70"}`}
            >
              List
            </button>
            <button
              type="button"
              onClick={() => setViewMode("cards")}
              className={`rounded px-3 py-1 text-sm ${viewMode === "cards" ? "bg-brand-green text-white" : "text-foreground/70"}`}
            >
              Cards
            </button>
          </div>
        </div>

        {viewMode === "cards" && (
          <div className="mt-3 rounded-md border border-brand-green/20 px-3 py-2 text-sm text-foreground/80">
            Drag cards onto each other to reorder guides manually.
          </div>
        )}

        {isAccessLoading && (
          <div className="mt-6 rounded-lg border bg-card p-4 text-sm text-muted-foreground">Checking access...</div>
        )}

        {!isAccessLoading && !isAdmin && (
          <div className="mt-6 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            You need an admin account to access this page.
          </div>
        )}

        {isAdmin && (
          <div className="mt-6 overflow-hidden rounded-xl border bg-card">
            {isLoading ? (
              <div className="p-4 text-sm text-muted-foreground">Loading guides...</div>
            ) : isError ? (
              <div className="p-4 text-sm text-red-700">Could not load guides.</div>
            ) : visibleGuides.length === 0 ? (
              <div className="p-4 text-sm text-muted-foreground">No guides yet.</div>
            ) : viewMode === "cards" ? (
              <div className="grid gap-4 p-4 sm:grid-cols-2 xl:grid-cols-3">
                {visibleGuides.map((guide) => (
                  <article
                    key={guide.id}
                    draggable
                    onDragStart={() => setDraggedGuideId(guide.id)}
                    onDragOver={(event) => event.preventDefault()}
                    onDrop={() => {
                      if (!draggedGuideId || draggedGuideId === guide.id) return;
                      reorderGuide({ sourceGuideId: draggedGuideId, targetGuideId: guide.id });
                      setDraggedGuideId(null);
                    }}
                    onDragEnd={() => setDraggedGuideId(null)}
                    className={`overflow-hidden rounded-lg border bg-transparent transition-all ${draggedGuideId === guide.id ? "scale-[0.98] opacity-60" : ""}`}
                  >
                    <Link to={`/admin/guides/${guide.id}`} className="block aspect-[16/9] w-full bg-muted">
                      {guide.cover_image ? (
                        <img
                          src={getVersionedMediaUrl(guide.cover_image, guide.updated_at)}
                          alt={guide.title}
                          className="h-full w-full object-cover transition-opacity hover:opacity-90"
                          loading="lazy"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                          No cover image
                        </div>
                      )}
                    </Link>
                    <div className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <p className="text-xs font-semibold uppercase tracking-wide text-brand-green">
                          {guide.category ?? "General"}
                        </p>
                        <span className="cursor-grab text-xs text-muted-foreground">Drag</span>
                      </div>
                      <h2 className="mt-2 font-display text-lg font-bold text-foreground">
                        <Link to={`/admin/guides/${guide.id}`} className="hover:text-brand-green hover:underline">
                          {guide.title}
                        </Link>
                      </h2>
                      <p className="mt-2 line-clamp-3 text-sm text-foreground/80">{guide.description}</p>
                      <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        <span>{guide.featured ? "Featured" : "Standard"}</span>
                        <span>•</span>
                        <span>{guide.published ? "Published" : "Draft"}</span>
                      </div>
                      <div className="mt-4 flex flex-wrap gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={isFeaturing || isReorderingGuide}
                          onClick={() => toggleFeatured({ guideId: guide.id, featured: !guide.featured })}
                        >
                          <Sparkles className="mr-1 h-3.5 w-3.5" />
                          {guide.featured ? "Unfeature" : "Feature"}
                        </Button>
                        <Button
                          size="sm"
                          variant={guide.published ? "outline" : "default"}
                          disabled={isPublishing || isReorderingGuide}
                          onClick={() => togglePublished({ guideId: guide.id, published: !guide.published })}
                        >
                          {guide.published ? <OctagonMinus className="mr-1 h-3.5 w-3.5" /> : <Upload className="mr-1 h-3.5 w-3.5" />}
                          {guide.published ? "Unpublish" : "Publish"}
                        </Button>
                        <Link to={`/guides/${guide.slug}`}>
                          <Button size="sm" variant="outline">
                            <Eye className="mr-1 h-3.5 w-3.5" />
                            View
                          </Button>
                        </Link>
                        <Link to={`/admin/guides/${guide.id}`}>
                          <Button size="sm" variant="outline" aria-label="Edit guide" title="Edit">
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <table className="min-w-full divide-y divide-border">
                <thead className="bg-muted/40">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">Title</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">Slug</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">Category</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">Featured</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">Published</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {visibleGuides.map((guide) => (
                    <tr key={guide.id}>
                      <td className="px-4 py-3 text-sm text-foreground">
                        <Link to={`/admin/guides/${guide.id}`} className="font-medium hover:text-brand-green hover:underline">
                          {guide.title}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{guide.slug}</td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{guide.category ?? "—"}</td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{guide.featured ? "Yes" : "No"}</td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{guide.published ? "Yes" : "No"}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="inline-flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={isFeaturing || isReorderingGuide}
                            onClick={() => toggleFeatured({ guideId: guide.id, featured: !guide.featured })}
                          >
                            <Sparkles className="mr-1 h-3.5 w-3.5" />
                            {guide.featured ? "Unfeature" : "Feature"}
                          </Button>
                          <Button
                            size="sm"
                            variant={guide.published ? "outline" : "default"}
                            disabled={isPublishing || isReorderingGuide}
                            onClick={() =>
                              togglePublished({ guideId: guide.id, published: !guide.published })
                            }
                          >
                            {guide.published ? <OctagonMinus className="mr-1 h-3.5 w-3.5" /> : <Upload className="mr-1 h-3.5 w-3.5" />}
                            {guide.published ? "Unpublish" : "Publish"}
                          </Button>
                          <Link to={`/guides/${guide.slug}`}>
                            <Button size="sm" variant="outline">
                              <Eye className="mr-1 h-3.5 w-3.5" />
                              View
                            </Button>
                          </Link>
                          <Link to={`/admin/guides/${guide.id}`}>
                            <Button size="sm" variant="outline" aria-label="Edit guide" title="Edit">
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </section>
    </Layout>
  );
}
