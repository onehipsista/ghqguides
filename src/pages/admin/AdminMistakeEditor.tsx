import { FormEvent, useEffect, useState } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { getAccessState } from "@/lib/access";
import { adminEmailAllowlist } from "@/lib/supabase";
import { getAdminIssueById, saveAdminIssue } from "@/lib/admin-issues";
import type { Severity } from "@/types/design-issue";

const DEFAULT_STATE = {
  title: "",
  category: "Typography",
  severity: "moderate" as Severity,
  body: "",
  how_to_fix: "",
  published: false,
  order_index: 0,
};

export default function AdminMistakeEditorPage() {
  const { id } = useParams();
  const isEditing = Boolean(id);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [form, setForm] = useState(DEFAULT_STATE);
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

  const { data: issueData, isLoading: isIssueLoading } = useQuery({
    queryKey: ["admin-issue", id],
    queryFn: () => getAdminIssueById(id as string),
    enabled: isAdmin && isEditing,
  });

  useEffect(() => {
    if (!issueData) return;

    setForm({
      title: issueData.title,
      category: issueData.category,
      severity: issueData.severity,
      body: issueData.body,
      how_to_fix: issueData.how_to_fix,
      published: issueData.published,
      order_index: issueData.order_index,
    });
  }, [issueData]);

  const { mutate: saveIssue, isPending: isSaving } = useMutation({
    mutationFn: () =>
      saveAdminIssue({
        id,
        title: form.title.trim(),
        category: form.category.trim(),
        severity: form.severity,
        body: form.body.trim(),
        how_to_fix: form.how_to_fix.trim(),
        published: form.published,
        order_index: Number(form.order_index) || 0,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-issues"] });
      queryClient.invalidateQueries({ queryKey: ["public-issues"] });
      navigate("/admin/mistakes");
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : "Could not save issue.";
      if (message.toLowerCase().includes("permission") || message.toLowerCase().includes("row-level")) {
        setErrorMessage(
          "Permission denied while saving. Make sure your profiles row has role='admin' and authenticated users have INSERT/UPDATE rights on ghq_guides.design_issues."
        );
        return;
      }

      setErrorMessage(message);
    },
  });

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    setErrorMessage("");

    if (!form.title.trim() || !form.body.trim() || !form.how_to_fix.trim()) {
      setErrorMessage("Title, body, and how to fix are required.");
      return;
    }

    saveIssue();
  };

  if (!isAccessLoading && !isAdmin) {
    return <Navigate to="/admin/mistakes" replace />;
  }

  return (
    <Layout>
      <section className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-center justify-between gap-3">
          <div>
            <h1 className="font-display text-2xl font-bold text-foreground">
              {isEditing ? "Edit Design Issue" : "New Design Issue"}
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {isEditing
                ? "Update this issue and save changes."
                : "Create a new issue for the mistakes library."}
            </p>
          </div>
          <Link to="/admin/mistakes">
            <Button variant="outline">Back</Button>
          </Link>
        </div>

        {isEditing && isIssueLoading && (
          <div className="mb-4 rounded-lg border bg-card p-4 text-sm text-muted-foreground">
            Loading issue...
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5 rounded-xl border bg-card p-5 sm:p-6">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={form.title}
              onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
              required
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Input
                id="category"
                value={form.category}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, category: event.target.value }))
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="severity">Severity</Label>
              <select
                id="severity"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={form.severity}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, severity: event.target.value as Severity }))
                }
              >
                <option value="minor">Minor</option>
                <option value="moderate">Moderate</option>
                <option value="major">Major</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="body">Body</Label>
            <Textarea
              id="body"
              rows={6}
              value={form.body}
              onChange={(event) => setForm((prev) => ({ ...prev, body: event.target.value }))}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="how_to_fix">How to Fix</Label>
            <Textarea
              id="how_to_fix"
              rows={6}
              value={form.how_to_fix}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, how_to_fix: event.target.value }))
              }
              required
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="order_index">Order index</Label>
              <Input
                id="order_index"
                type="number"
                value={form.order_index}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, order_index: Number(event.target.value) || 0 }))
                }
              />
            </div>

            <div className="flex items-center gap-2 pt-8">
              <input
                id="published"
                type="checkbox"
                checked={form.published}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, published: event.target.checked }))
                }
              />
              <Label htmlFor="published">Published</Label>
            </div>
          </div>

          {errorMessage && (
            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {errorMessage}
            </div>
          )}

          <div className="flex gap-3">
            <Button type="submit" disabled={isSaving}>
              {isSaving ? "Saving..." : "Save Issue"}
            </Button>
            <Link to="/admin/mistakes">
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </Link>
          </div>
        </form>
      </section>
    </Layout>
  );
}
