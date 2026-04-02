import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { getAccessState } from "@/lib/access";
import { getAdminGuides, setGuideFeatured, setGuidePublished } from "@/lib/admin-guides";
import { adminEmailAllowlist } from "@/lib/supabase";

export default function AdminGuidesPage() {
  const queryClient = useQueryClient();

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

  return (
    <Layout>
      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <h1 className="font-display text-2xl font-bold text-foreground">Admin — Guides</h1>
        <p className="mt-2 text-sm text-muted-foreground">Create and manage guide metadata and visibility.</p>

        <div className="mt-4">
          <Link to="/admin/guides/new">
            <Button>Add New Guide</Button>
          </Link>
        </div>

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
            ) : guides.length === 0 ? (
              <div className="p-4 text-sm text-muted-foreground">No guides yet.</div>
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
                  {guides.map((guide) => (
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
                            disabled={isFeaturing}
                            onClick={() => toggleFeatured({ guideId: guide.id, featured: !guide.featured })}
                          >
                            {guide.featured ? "Unfeature" : "Feature"}
                          </Button>
                          <Button
                            size="sm"
                            variant={guide.published ? "outline" : "default"}
                            disabled={isPublishing}
                            onClick={() =>
                              togglePublished({ guideId: guide.id, published: !guide.published })
                            }
                          >
                            {guide.published ? "Unpublish" : "Publish"}
                          </Button>
                          <Link to={`/admin/guides/${guide.id}`}>
                            <Button size="sm" variant="outline">Edit</Button>
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
