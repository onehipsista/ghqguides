import { FormEvent, useEffect, useMemo, useState } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { ImageUpload } from "@/components/ImageUpload";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { getAccessState } from "@/lib/access";
import { uploadToPublicBucket } from "@/lib/media";
import {
  deleteAdminProductAsset,
  getAdminProductAssets,
  getAdminProductById,
  saveAdminProduct,
  saveAdminProductAsset,
} from "@/lib/admin-products";
import { adminEmailAllowlist } from "@/lib/supabase";

interface ProductFormState {
  title: string;
  slug: string;
  description: string;
  long_description: string;
  category: string;
  audience_market: string;
  image_url: string;
  shop_thumbnail_url: string;
  gallery_image_urls: string[];
  sample_pdf_url: string;
  price_dollars: string;
  currency: string;
  stripe_payment_link: string;
  featured: boolean;
  published: boolean;
  order_index: string;
  grants_guide_access: boolean;
  access_scope: "downloads" | "guides_plus_mistakes";
  tags_csv: string;
}

const DEFAULT_STATE: ProductFormState = {
  title: "",
  slug: "",
  description: "",
  long_description: "",
  category: "PDF Guide",
  audience_market: "",
  image_url: "",
  shop_thumbnail_url: "",
  gallery_image_urls: [],
  sample_pdf_url: "",
  price_dollars: "",
  currency: "usd",
  stripe_payment_link: "",
  featured: false,
  published: false,
  order_index: "0",
  grants_guide_access: false,
  access_scope: "downloads",
  tags_csv: "",
};

const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");

export default function AdminProductEditorPage() {
  const { id } = useParams();
  const isEditing = Boolean(id);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [form, setForm] = useState<ProductFormState>(DEFAULT_STATE);
  const [errorMessage, setErrorMessage] = useState("");
  const [assetTitle, setAssetTitle] = useState("");
  const [assetPath, setAssetPath] = useState("");
  const [isUploadingSamplePdf, setIsUploadingSamplePdf] = useState(false);
  const [samplePdfUploadError, setSamplePdfUploadError] = useState("");

  const { data: accessState, isLoading: isAccessLoading } = useQuery({
    queryKey: ["access-state"],
    queryFn: getAccessState,
  });

  const isAdminByRole = accessState?.role === "admin";
  const isAdminByAllowlist = Boolean(
    accessState?.email && adminEmailAllowlist.includes(accessState.email.toLowerCase())
  );
  const isAdmin = isAdminByRole || isAdminByAllowlist;

  const { data: productData, isLoading: isProductLoading } = useQuery({
    queryKey: ["admin-product", id],
    queryFn: () => getAdminProductById(id as string),
    enabled: isAdmin && isEditing,
  });

  const { data: assets = [] } = useQuery({
    queryKey: ["admin-product-assets", id],
    queryFn: () => getAdminProductAssets(id as string),
    enabled: isAdmin && isEditing,
  });

  useEffect(() => {
    if (!productData) return;
    setForm({
      title: productData.title,
      slug: productData.slug,
      description: productData.description,
      long_description: productData.long_description,
      category: productData.category ?? "",
      audience_market: productData.audience_market ?? "",
      image_url: productData.image_url ?? "",
      shop_thumbnail_url: productData.shop_thumbnail_url ?? "",
      gallery_image_urls: productData.gallery_image_urls ?? [],
      sample_pdf_url: productData.sample_pdf_url ?? "",
      price_dollars: String((productData.price_cents || 0) / 100),
      currency: productData.currency,
      stripe_payment_link: productData.stripe_payment_link ?? "",
      featured: productData.featured,
      published: productData.published,
      order_index: String(productData.order_index ?? 0),
      grants_guide_access: productData.grants_guide_access,
      access_scope: productData.access_scope,
      tags_csv: productData.tags.join(", "),
    });
  }, [productData]);

  const parsedPriceCents = useMemo(() => {
    const numeric = Number(form.price_dollars || 0);
    if (Number.isNaN(numeric) || numeric < 0) return 0;
    return Math.round(numeric * 100);
  }, [form.price_dollars]);

  const { mutate: saveProduct, isPending: isSaving } = useMutation({
    mutationFn: () =>
      saveAdminProduct({
        id,
        title: form.title.trim(),
        slug: form.slug.trim(),
        description: form.description.trim(),
        long_description: form.long_description.trim(),
        category: form.category.trim() || null,
        audience_market: form.audience_market.trim() || null,
        image_url: form.image_url.trim() || null,
        shop_thumbnail_url: form.shop_thumbnail_url.trim() || null,
        gallery_image_urls: form.gallery_image_urls.map((url) => url.trim()).filter(Boolean),
        sample_pdf_url: form.sample_pdf_url.trim() || null,
        price_cents: parsedPriceCents,
        currency: form.currency.trim().toLowerCase() || "usd",
        stripe_payment_link: form.stripe_payment_link.trim() || null,
        featured: form.featured,
        published: form.published,
        order_index: Number(form.order_index || 0),
        grants_guide_access: form.grants_guide_access,
        access_scope: form.grants_guide_access ? "guides_plus_mistakes" : "downloads",
        tags: form.tags_csv
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      queryClient.invalidateQueries({ queryKey: ["public-products"] });
      navigate("/admin/products");
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : "Could not save product.";
      setErrorMessage(message);
    },
  });

  const { mutate: addAsset, isPending: isAddingAsset } = useMutation({
    mutationFn: () =>
      saveAdminProductAsset({
        product_id: id as string,
        title: assetTitle.trim(),
        file_path: assetPath.trim(),
        file_ext: null,
        file_size_bytes: null,
        sort_order: assets.length,
        is_active: true,
      }),
    onSuccess: () => {
      setAssetTitle("");
      setAssetPath("");
      queryClient.invalidateQueries({ queryKey: ["admin-product-assets", id] });
    },
  });

  const { mutate: deleteAsset, isPending: isDeletingAsset } = useMutation({
    mutationFn: (assetId: string) => deleteAdminProductAsset(assetId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-product-assets", id] });
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
    saveProduct();
  };

  const handleSamplePdfUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setSamplePdfUploadError("");
    setIsUploadingSamplePdf(true);

    try {
      const url = await uploadToPublicBucket(file, "guide-media", "product-samples");
      setForm((prev) => ({ ...prev, sample_pdf_url: url }));
    } catch (error) {
      setSamplePdfUploadError(error instanceof Error ? error.message : "PDF upload failed.");
    } finally {
      setIsUploadingSamplePdf(false);
      event.target.value = "";
    }
  };

  if (!isAccessLoading && !isAdmin) {
    return <Navigate to="/admin/products" replace />;
  }

  return (
    <Layout>
      <section className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-center justify-between gap-3">
          <div>
            <h1 className="font-display text-2xl font-bold text-foreground">{isEditing ? "Edit Product" : "New Product"}</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {isEditing ? "Update product details and entitlement behavior." : "Create a new product."}
            </p>
          </div>
          <Link to="/admin/products">
            <Button variant="outline">Back</Button>
          </Link>
        </div>

        {isEditing && isProductLoading && (
          <div className="mb-4 rounded-lg border bg-card p-4 text-sm text-muted-foreground">Loading product...</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5 rounded-xl border bg-card p-5 sm:p-6">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={form.title}
              onChange={(event) => {
                const value = event.target.value;
                setForm((prev) => ({ ...prev, title: value, slug: prev.slug || slugify(value) }));
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
              <Input id="category" value={form.category} onChange={(event) => setForm((prev) => ({ ...prev, category: event.target.value }))} />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="price">Price (USD)</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                min="0"
                value={form.price_dollars}
                onChange={(event) => setForm((prev) => ({ ...prev, price_dollars: event.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="currency">Currency</Label>
              <Input id="currency" value={form.currency} onChange={(event) => setForm((prev) => ({ ...prev, currency: event.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="order">Order Index</Label>
              <Input id="order" type="number" value={form.order_index} onChange={(event) => setForm((prev) => ({ ...prev, order_index: event.target.value }))} />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" rows={3} value={form.description} onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="long_description">Long Description</Label>
            <Textarea id="long_description" rows={5} value={form.long_description} onChange={(event) => setForm((prev) => ({ ...prev, long_description: event.target.value }))} />
          </div>

          <ImageUpload
            label="Product Main Image (Detail Page)"
            value={form.image_url || null}
            onChange={(url) => setForm((prev) => ({ ...prev, image_url: url }))}
          />

          <ImageUpload
            label="Shop Thumbnail (4:3 for /shop cards)"
            value={form.shop_thumbnail_url || null}
            onChange={(url) => setForm((prev) => ({ ...prev, shop_thumbnail_url: url }))}
          />

          <div className="space-y-3 rounded-lg border border-dashed p-4">
            <div>
              <h3 className="text-sm font-semibold text-foreground">Alternative Product Photos</h3>
              <p className="mt-1 text-xs text-muted-foreground">
                Add optional images. On the product page, clicking a thumbnail will swap the main image.
              </p>
            </div>

            {form.gallery_image_urls.length === 0 && (
              <p className="text-xs text-muted-foreground">No alternative photos added yet.</p>
            )}

            <div className="space-y-3">
              {form.gallery_image_urls.map((url, index) => (
                <div key={`gallery-${index}`} className="rounded-md border p-3">
                  <ImageUpload
                    label={`Alternative Photo ${index + 1}`}
                    value={url || null}
                    onChange={(nextUrl) =>
                      setForm((prev) => ({
                        ...prev,
                        gallery_image_urls: prev.gallery_image_urls.map((item, itemIndex) =>
                          itemIndex === index ? nextUrl : item
                        ),
                      }))
                    }
                  />
                  <div className="mt-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setForm((prev) => ({
                          ...prev,
                          gallery_image_urls: prev.gallery_image_urls.filter((_, itemIndex) => itemIndex !== index),
                        }))
                      }
                    >
                      Remove Photo
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            <Button
              type="button"
              variant="outline"
              onClick={() =>
                setForm((prev) => ({
                  ...prev,
                  gallery_image_urls: [...prev.gallery_image_urls, ""],
                }))
              }
            >
              Add Alternative Photo
            </Button>
          </div>

          <div className="space-y-2">
            <Label htmlFor="sample_pdf_url">Sample PDF URL (optional)</Label>
            <div className="flex flex-wrap items-center gap-2">
              <Input
                id="sample_pdf_url"
                value={form.sample_pdf_url}
                onChange={(event) => setForm((prev) => ({ ...prev, sample_pdf_url: event.target.value }))}
                placeholder="https://.../sample.pdf"
                className="flex-1"
              />
              <Button type="button" variant="outline" className="relative" disabled={isUploadingSamplePdf}>
                {isUploadingSamplePdf ? (
                  <>
                    <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                    Uploading…
                  </>
                ) : (
                  "Upload PDF"
                )}
                <input
                  type="file"
                  accept="application/pdf"
                  className="absolute inset-0 cursor-pointer opacity-0"
                  disabled={isUploadingSamplePdf}
                  onChange={handleSamplePdfUpload}
                />
              </Button>
              {form.sample_pdf_url && (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setForm((prev) => ({ ...prev, sample_pdf_url: "" }))}
                >
                  Remove PDF
                </Button>
              )}
            </div>
            {samplePdfUploadError && <p className="text-xs text-red-600">{samplePdfUploadError}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="stripe_link">Stripe Payment Link</Label>
            <Input
              id="stripe_link"
              value={form.stripe_payment_link}
              onChange={(event) => setForm((prev) => ({ ...prev, stripe_payment_link: event.target.value }))}
              placeholder="https://buy.stripe.com/..."
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="audience">Audience</Label>
              <Input id="audience" value={form.audience_market} onChange={(event) => setForm((prev) => ({ ...prev, audience_market: event.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tags">Tags (comma separated)</Label>
              <Input id="tags" value={form.tags_csv} onChange={(event) => setForm((prev) => ({ ...prev, tags_csv: event.target.value }))} />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.featured} onChange={(event) => setForm((prev) => ({ ...prev, featured: event.target.checked }))} />
              Featured
            </label>

            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.published} onChange={(event) => setForm((prev) => ({ ...prev, published: event.target.checked }))} />
              Published
            </label>

            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.grants_guide_access}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    grants_guide_access: event.target.checked,
                    access_scope: event.target.checked ? "guides_plus_mistakes" : "downloads",
                  }))
                }
              />
              Grants Guide Access
            </label>
          </div>

          {errorMessage && (
            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{errorMessage}</div>
          )}

          <div className="flex gap-3">
            <Button type="submit" disabled={isSaving}>{isSaving ? "Saving..." : "Save Product"}</Button>
            <Link to="/admin/products">
              <Button type="button" variant="outline">Cancel</Button>
            </Link>
          </div>
        </form>

        {isEditing && (
          <div className="mt-8 rounded-xl border bg-card p-5">
            <h2 className="font-display text-lg font-semibold">Secure Download Assets</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Add private bucket file paths (for example: guides/pdf/my-guide-v2.pdf). Signed URLs will be issued server-side.
            </p>

            <div className="mt-4 grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
              <Input placeholder="Asset title" value={assetTitle} onChange={(event) => setAssetTitle(event.target.value)} />
              <Input placeholder="storage path" value={assetPath} onChange={(event) => setAssetPath(event.target.value)} />
              <Button
                type="button"
                disabled={!assetTitle.trim() || !assetPath.trim() || isAddingAsset}
                onClick={() => addAsset()}
              >
                Add Asset
              </Button>
            </div>

            <ul className="mt-4 space-y-2">
              {assets.length === 0 ? (
                <li className="text-sm text-muted-foreground">No assets yet.</li>
              ) : (
                assets.map((asset) => (
                  <li key={asset.id} className="flex items-center justify-between rounded-md border px-3 py-2">
                    <div>
                      <p className="text-sm font-medium text-foreground">{asset.title}</p>
                      <p className="text-xs text-muted-foreground">{asset.file_path}</p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={isDeletingAsset}
                      onClick={() => deleteAsset(asset.id)}
                    >
                      Remove
                    </Button>
                  </li>
                ))
              )}
            </ul>
          </div>
        )}
      </section>
    </Layout>
  );
}
