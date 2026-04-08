import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Copy, OctagonMinus, Pencil, Upload } from "lucide-react";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { getAccessState } from "@/lib/access";
import { duplicateIssue, getAdminIssues, moveIssue, setIssuePublished } from "@/lib/admin-issues";
import { adminEmailAllowlist } from "@/lib/supabase";
import type { DesignIssue } from "@/types/design-issue";

export default function AdminMistakesPage() {
  const queryClient = useQueryClient();
  const [sortBy, setSortBy] = useState<"order" | "title" | "category" | "severity" | "published">("order");

  const { data: accessState, isLoading: isAccessLoading } = useQuery({
    queryKey: ["access-state"],
    queryFn: getAccessState,
  });

  const isAdminByRole = accessState?.role === "admin";
  const isAdminByAllowlist = Boolean(
    accessState?.email && adminEmailAllowlist.includes(accessState.email.toLowerCase())
  );
  const isAdmin = isAdminByRole || isAdminByAllowlist;

  const {
    data: issues = [],
    isLoading: isIssuesLoading,
    isError,
  } = useQuery({
    queryKey: ["admin-issues"],
    queryFn: getAdminIssues,
    enabled: isAdmin,
  });

  const { mutate: togglePublish, isPending: isUpdating } = useMutation({
    mutationFn: ({ issueId, published }: { issueId: string; published: boolean }) =>
      setIssuePublished(issueId, published),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-issues"] });
      queryClient.invalidateQueries({ queryKey: ["public-issues"] });
    },
  });

  const { mutate: duplicate, isPending: isDuplicating } = useMutation({
    mutationFn: (issueId: string) => duplicateIssue(issueId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-issues"] });
      queryClient.invalidateQueries({ queryKey: ["public-issues"] });
    },
  });

  const { mutate: move, isPending: isMoving } = useMutation({
    mutationFn: ({ issueId, direction }: { issueId: string; direction: "up" | "down" }) =>
      moveIssue(issueId, direction),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-issues"] });
      queryClient.invalidateQueries({ queryKey: ["public-issues"] });
    },
  });

  const sortedIssues = useMemo(() => {
    const ordered = [...issues].sort((a: DesignIssue, b: DesignIssue) => a.order_index - b.order_index);

    if (sortBy === "order") {
      return ordered;
    }

    return [...ordered].sort((a: DesignIssue, b: DesignIssue) => {
      if (sortBy === "published") {
        return Number(b.published) - Number(a.published);
      }

      if (sortBy === "severity") {
        const severityWeight: Record<DesignIssue["severity"], number> = {
          major: 3,
          moderate: 2,
          minor: 1,
        };
        return severityWeight[b.severity] - severityWeight[a.severity];
      }

      return a[sortBy].localeCompare(b[sortBy]);
    });
  }, [issues, sortBy]);

  const categoryCounts = useMemo(() => {
    return issues.reduce<Record<string, number>>((acc, issue) => {
      const key = issue.category?.trim() || "Uncategorized";
      acc[key] = (acc[key] ?? 0) + 1;
      return acc;
    }, {});
  }, [issues]);

  return (
    <Layout>
      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <h1 className="font-display text-2xl font-bold text-foreground">Admin — Design Issues</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Manage publish status for issues in `ghq_guides.design_issues`.
        </p>
        <div className="mt-4">
          <Link to="/admin/mistakes/new">
            <Button>Add New Issue</Button>
          </Link>
        </div>

        {isAccessLoading && (
          <div className="mt-6 rounded-lg border bg-card p-4 text-sm text-muted-foreground">
            Checking access...
          </div>
        )}

        {!isAccessLoading && !isAdmin && (
          <div className="mt-6 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            You need an admin account to access this page.
            <div className="mt-2 text-xs text-amber-800/90">
              Current role: {accessState?.role ?? "none"}. Current email: {accessState?.email ?? "unknown"}.
            </div>
          </div>
        )}

        {isAdmin && (
          <div className="mt-6 overflow-hidden rounded-xl border bg-card">
            <div className="flex items-center justify-end border-b border-border/70 px-4 py-3">
              <div className="flex items-center gap-2 text-sm">
                <label htmlFor="sortBy" className="text-muted-foreground">
                  Sort by
                </label>
                <select
                  id="sortBy"
                  className="h-9 rounded-md border border-input bg-background px-2 text-sm"
                  value={sortBy}
                  onChange={(event) =>
                    setSortBy(
                      event.target.value as "order" | "title" | "category" | "severity" | "published"
                    )
                  }
                >
                  <option value="order">Custom order</option>
                  <option value="title">Title</option>
                  <option value="category">Category</option>
                  <option value="severity">Severity</option>
                  <option value="published">Published</option>
                </select>
              </div>
            </div>
            {Object.keys(categoryCounts).length > 0 && (
              <div className="flex flex-wrap gap-2 border-b border-border/70 px-4 py-3">
                {Object.entries(categoryCounts)
                  .sort(([a], [b]) => a.localeCompare(b))
                  .map(([category, count]) => (
                    <span
                      key={category}
                      className="rounded-[2px] border border-brand-green/50 bg-brand-green/[0.025] px-2 py-1 text-xs font-medium text-brand-green"
                    >
                      {category}: {count}
                    </span>
                  ))}
              </div>
            )}
            {isIssuesLoading ? (
              <div className="p-4 text-sm text-muted-foreground">Loading issues...</div>
            ) : isError ? (
              <div className="p-4 text-sm text-red-700">Could not load issues.</div>
            ) : sortedIssues.length === 0 ? (
              <div className="p-4 text-sm text-muted-foreground">No issues yet.</div>
            ) : (
              <table className="min-w-full divide-y divide-border">
                <thead className="bg-muted/40">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Title
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Category
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Severity
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Published
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {sortedIssues.map((issue, index) => (
                    <tr key={issue.id}>
                      <td className="px-4 py-3 text-sm text-foreground">
                        <Link to={`/admin/mistakes/${issue.id}`} className="font-medium hover:text-brand-green hover:underline">
                          {issue.title}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{issue.category}</td>
                      <td className="px-4 py-3 text-sm capitalize text-muted-foreground">
                        {issue.severity}
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        {issue.published ? "Yes" : "No"}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="inline-flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={isMoving || sortBy !== "order" || index === 0}
                            onClick={() => move({ issueId: issue.id, direction: "up" })}
                            aria-label="Move up"
                          >
                            ↑
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={isMoving || sortBy !== "order" || index === sortedIssues.length - 1}
                            onClick={() => move({ issueId: issue.id, direction: "down" })}
                            aria-label="Move down"
                          >
                            ↓
                          </Button>
                          <Link to={`/admin/mistakes/${issue.id}`}>
                            <Button size="sm" variant="outline" aria-label="Edit issue" title="Edit">
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                          </Link>
                          <Button
                            size="sm"
                            variant="outline"
                            aria-label="Duplicate issue"
                            title="Duplicate"
                            disabled={isDuplicating}
                            onClick={() => duplicate(issue.id)}
                          >
                            <Copy className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            size="sm"
                            variant={issue.published ? "outline" : "default"}
                            disabled={isUpdating || isDuplicating || isMoving}
                            onClick={() =>
                              togglePublish({
                                issueId: issue.id,
                                published: !issue.published,
                              })
                            }
                          >
                            {issue.published ? (
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
