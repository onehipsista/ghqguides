import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Copy, OctagonMinus, Pencil, Trash2, Upload } from "lucide-react";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { getAccessState } from "@/lib/access";
import { adminEmailAllowlist } from "@/lib/supabase";
import { deleteAdminProduct, duplicateAdminProduct, getAdminProducts, saveAdminProduct } from "@/lib/admin-products";
import { formatProductPrice } from "@/lib/products";

export default function AdminProductsPage() {
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

  const { data: products = [], isLoading, isError } = useQuery({
    queryKey: ["admin-products"],
    queryFn: getAdminProducts,
    enabled: isAdmin,
  });

  const { mutate: deleteProduct, isPending: isDeleting } = useMutation({
    mutationFn: (id: string) => deleteAdminProduct(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      queryClient.invalidateQueries({ queryKey: ["public-products"] });
    },
  });

  const { mutate: duplicateProduct, isPending: isDuplicating } = useMutation({
    mutationFn: (id: string) => duplicateAdminProduct(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      queryClient.invalidateQueries({ queryKey: ["public-products"] });
    },
  });

  const { mutate: togglePublished, isPending: isPublishing } = useMutation({
    mutationFn: ({ id, published }: { id: string; published: boolean }) => {
      const product = products.find((item) => item.id === id);
      if (!product) {
        throw new Error("Product not found.");
      }
      return saveAdminProduct({
        ...product,
        published,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      queryClient.invalidateQueries({ queryKey: ["public-products"] });
    },
  });

  return (
    <Layout>
      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="font-display text-2xl font-bold text-foreground">Admin — Products</h1>
            <p className="mt-2 text-sm text-muted-foreground">Manage PDF products and Stripe payment links.</p>
          </div>
          <Link to="/admin/products/new">
            <Button>Add Product</Button>
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
              <div className="p-4 text-sm text-muted-foreground">Loading products...</div>
            ) : isError ? (
              <div className="p-4 text-sm text-red-700">Could not load products.</div>
            ) : products.length === 0 ? (
              <div className="p-4 text-sm text-muted-foreground">No products yet.</div>
            ) : (
              <table className="min-w-full divide-y divide-border">
                <thead className="bg-muted/40">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">Title</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">Price</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">Scope</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">Published</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {products.map((product) => (
                    <tr key={product.id}>
                      <td className="px-4 py-3 text-sm text-foreground">
                        <Link to={`/admin/products/${product.id}`} className="font-medium hover:text-brand-green hover:underline">
                          {product.title}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{formatProductPrice(product.price_cents, product.currency)}</td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        {product.grants_guide_access ? "Guides + Mistakes" : "Downloads only"}
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{product.published ? "Yes" : "No"}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="inline-flex items-center gap-2">
                          <Button
                            size="sm"
                            variant={product.published ? "outline" : "default"}
                            disabled={isPublishing || isDeleting || isDuplicating}
                            onClick={() => togglePublished({ id: product.id, published: !product.published })}
                          >
                            {product.published ? (
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
                          <Link to={`/admin/products/${product.id}`}>
                            <Button size="sm" variant="outline" aria-label="Edit product" title="Edit">
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                          </Link>
                          <Button
                            size="sm"
                            variant="outline"
                            aria-label="Duplicate product"
                            title="Duplicate"
                            disabled={isDeleting || isPublishing || isDuplicating}
                            onClick={() => duplicateProduct(product.id)}
                          >
                            <Copy className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            aria-label="Delete product"
                            title="Delete"
                            disabled={isDeleting || isPublishing || isDuplicating}
                            onClick={() => {
                              if (!window.confirm("Delete this product?")) return;
                              deleteProduct(product.id);
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
        )}
      </section>
    </Layout>
  );
}
