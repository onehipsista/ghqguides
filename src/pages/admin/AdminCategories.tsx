import { FormEvent, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getAccessState } from "@/lib/access";
import {
  createCategory,
  deleteCategory,
  getAdminCategories,
  updateCategory,
} from "@/lib/admin-categories";
import { adminEmailAllowlist } from "@/lib/supabase";

const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");

export default function AdminCategoriesPage() {
  const queryClient = useQueryClient();

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
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

  const { data: categories = [], isLoading, isError } = useQuery({
    queryKey: ["admin-categories"],
    queryFn: getAdminCategories,
    enabled: isAdmin,
  });

  const { mutate: addCategory, isPending: isAdding } = useMutation({
    mutationFn: ({ categoryName, categorySlug }: { categoryName: string; categorySlug: string }) =>
      createCategory(categoryName, categorySlug),
    onSuccess: () => {
      setName("");
      setSlug("");
      setErrorMessage("");
      queryClient.invalidateQueries({ queryKey: ["admin-categories"] });
    },
    onError: (error: unknown) => {
      setErrorMessage(error instanceof Error ? error.message : "Could not add category.");
    },
  });

  const { mutate: renameCategory, isPending: isRenaming } = useMutation({
    mutationFn: ({ id, categoryName, categorySlug }: { id: string; categoryName: string; categorySlug: string }) =>
      updateCategory(id, categoryName, categorySlug),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-categories"] });
    },
  });

  const { mutate: removeCategory, isPending: isDeleting } = useMutation({
    mutationFn: (id: string) => deleteCategory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-categories"] });
    },
  });

  const handleCreate = (event: FormEvent) => {
    event.preventDefault();
    setErrorMessage("");

    const nextName = name.trim();
    const nextSlug = (slug.trim() || slugify(nextName)).trim();

    if (!nextName || !nextSlug) {
      setErrorMessage("Name and slug are required.");
      return;
    }

    addCategory({ categoryName: nextName, categorySlug: nextSlug });
  };

  if (!isAccessLoading && !isAdmin) {
    return <Navigate to="/admin" replace />;
  }

  return (
    <Layout>
      <section className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-center justify-between gap-3">
          <div>
            <h1 className="font-display text-2xl font-bold text-foreground">Admin — Categories</h1>
            <p className="mt-2 text-sm text-muted-foreground">Manage guide categories.</p>
          </div>
          <Link to="/admin">
            <Button variant="outline">Back</Button>
          </Link>
        </div>

        <form onSubmit={handleCreate} className="rounded-xl border bg-card p-5">
          <h2 className="font-display text-lg font-semibold text-foreground">Add Category</h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
            <Input
              placeholder="Name"
              value={name}
              onChange={(event) => {
                const value = event.target.value;
                setName(value);
                if (!slug) setSlug(slugify(value));
              }}
            />
            <Input
              placeholder="slug"
              value={slug}
              onChange={(event) => setSlug(slugify(event.target.value))}
            />
            <Button type="submit" disabled={isAdding}>Add</Button>
          </div>
          {errorMessage && (
            <p className="mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {errorMessage}
            </p>
          )}
        </form>

        <div className="mt-6 rounded-xl border bg-card">
          {isLoading ? (
            <div className="p-4 text-sm text-muted-foreground">Loading categories...</div>
          ) : isError ? (
            <div className="p-4 text-sm text-red-700">Could not load categories.</div>
          ) : categories.length === 0 ? (
            <div className="p-4 text-sm text-muted-foreground">No categories yet.</div>
          ) : (
            <ul className="divide-y divide-border">
              {categories.map((category) => (
                <li key={category.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
                  <Input
                    defaultValue={category.name}
                    onBlur={(event) => {
                      const nextName = event.target.value.trim();
                      if (nextName && nextName !== category.name) {
                        renameCategory({ id: category.id, categoryName: nextName, categorySlug: slugify(nextName) });
                      }
                    }}
                  />
                  <Input
                    defaultValue={category.slug}
                    onBlur={(event) => {
                      const nextSlug = slugify(event.target.value);
                      if (nextSlug && nextSlug !== category.slug) {
                        renameCategory({ id: category.id, categoryName: category.name, categorySlug: nextSlug });
                      }
                    }}
                  />
                  <Button
                    variant="outline"
                    disabled={isDeleting || isRenaming}
                    onClick={() => {
                      if (!window.confirm("Delete this category?")) return;
                      removeCategory(category.id);
                    }}
                  >
                    Delete
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </Layout>
  );
}
