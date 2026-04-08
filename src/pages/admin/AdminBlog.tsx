import { Link, Navigate, useLocation } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Copy, OctagonMinus, Pencil, Trash2, Upload } from "lucide-react";
import { format, isValid } from "date-fns";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { getAccessState } from "@/lib/access";
import { adminEmailAllowlist } from "@/lib/supabase";
import {
  deleteAdminPost,
  duplicateAdminPost,
  getAdminPosts,
  saveAdminPost,
} from "@/lib/admin-posts";

const safeFormatDate = (value: string | null | undefined, pattern: string) => {
  if (!value) return "—";
  const date = new Date(value);
  return isValid(date) ? format(date, pattern) : "—";
};

export default function AdminBlogPage() {
  const location = useLocation();
  const queryClient = useQueryClient();

  const { data: accessState, isLoading: isAccessLoading } = useQuery({
    queryKey: ["access-state"],
    queryFn: getAccessState,
  });

  const isAdmin =
    accessState?.role === "admin" ||
    Boolean(accessState?.email && adminEmailAllowlist.includes(accessState.email.toLowerCase()));

  const { data: posts = [], isLoading } = useQuery({
    queryKey: ["admin-posts"],
    queryFn: getAdminPosts,
    enabled: isAdmin,
  });

  const { mutate: deletePost, isPending: isDeleting } = useMutation({
    mutationFn: (id: string) => deleteAdminPost(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-posts"] }),
  });

  const { mutate: duplicatePost, isPending: isDuplicating } = useMutation({
    mutationFn: (id: string) => duplicateAdminPost(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-posts"] }),
  });

  const { mutate: togglePublish, isPending: isToggling } = useMutation({
    mutationFn: ({ id, status }: { id: string; status: "draft" | "published" }) => {
      const post = posts.find((p) => p.id === id);
      if (!post) throw new Error("Post not found.");
      return saveAdminPost({ ...post, id, status });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-posts"] }),
  });

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
      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl font-bold text-foreground">Admin — What's Hip</h1>
            <p className="mt-1 text-sm text-muted-foreground">Manage posts, publishing, and What's Hip categories.</p>
          </div>
          <Link to="/admin/blog/new">
            <Button>New Post</Button>
          </Link>
        </div>

        <div className="mt-6 overflow-hidden rounded-xl border bg-card">
          {isLoading ? (
            <div className="p-4 text-sm text-muted-foreground">Loading posts...</div>
          ) : posts.length === 0 ? (
            <div className="p-6 text-center text-sm text-muted-foreground">
              No posts yet. Create your first post above.
            </div>
          ) : (
            <table className="min-w-full divide-y divide-border">
              <thead className="bg-muted/40">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">Title</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">Category</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">Read Time</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">Published</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">Status</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {posts.map((post) => (
                  <tr key={post.id}>
                    <td className="px-4 py-3 text-sm font-medium text-foreground">
                      <Link to={`/admin/blog/${post.id}`} className="hover:text-brand-green hover:underline">
                        {post.title}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{post.category ?? "—"}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{post.reading_time_minutes} min</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {safeFormatDate(post.published_at, "MMM d, yyyy")}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {post.status === "published" ? (
                        <span className="font-medium text-green-600">Published</span>
                      ) : (
                        <span className="text-orange-500">Draft</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="inline-flex items-center gap-2">
                        <Button
                          size="sm"
                          variant={post.status === "published" ? "outline" : "default"}
                          disabled={isToggling || isDeleting || isDuplicating}
                          onClick={() =>
                            togglePublish({
                              id: post.id,
                              status: post.status === "published" ? "draft" : "published",
                            })
                          }
                        >
                          {post.status === "published" ? (
                            <>
                              <OctagonMinus className="h-3.5 w-3.5" />
                              <span className="sr-only">Unpublish</span>
                            </>
                          ) : (
                            <>
                              <Upload className="mr-1 h-3.5 w-3.5" />
                              Publish
                            </>
                          )}
                        </Button>
                        <Link to={`/admin/blog/${post.id}`}>
                          <Button size="sm" variant="outline" aria-label="Edit post" title="Edit">
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                        </Link>
                        <Button
                          size="sm"
                          variant="outline"
                          aria-label="Duplicate post"
                          title="Duplicate"
                          disabled={isDuplicating || isDeleting || isToggling}
                          onClick={() => duplicatePost(post.id)}
                        >
                          <Copy className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-red-200 text-red-600 hover:bg-red-50"
                          aria-label="Delete post"
                          title="Delete"
                          disabled={isDeleting || isDuplicating || isToggling}
                          onClick={() => {
                            if (!confirm(`Delete "${post.title}"?`)) return;
                            deletePost(post.id);
                          }}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>
    </Layout>
  );
}
