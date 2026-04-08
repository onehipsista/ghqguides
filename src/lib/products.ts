import { supabase } from "@/lib/supabase";
import type { Product, ProductAsset, ProductsSource } from "@/types/product";

export interface ProductsResult {
  products: Product[];
  source: ProductsSource;
}

interface ProductRow {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  long_description: string | null;
  category: string | null;
  audience_market: string | null;
  image_url: string | null;
  shop_thumbnail_url: string | null;
  gallery_image_urls: string[] | null;
  sample_pdf_url: string | null;
  price_cents: number | null;
  currency: string | null;
  stripe_payment_link: string | null;
  featured: boolean | null;
  published: boolean | null;
  order_index: number | null;
  grants_guide_access: boolean | null;
  access_scope: "downloads" | "guides_plus_mistakes" | null;
  tags: string[] | null;
  updated_at: string | null;
  created_at: string | null;
}

interface ProductAssetRow {
  id: string;
  product_id: string;
  title: string;
  file_path: string;
  file_ext: string | null;
  file_size_bytes: number | null;
  sort_order: number | null;
  is_active: boolean | null;
  created_at: string | null;
}

const PRODUCT_SELECT =
  "id, title, slug, description, long_description, category, audience_market, image_url, shop_thumbnail_url, gallery_image_urls, sample_pdf_url, price_cents, currency, stripe_payment_link, featured, published, order_index, grants_guide_access, access_scope, tags, updated_at, created_at";

const toProduct = (row: ProductRow): Product => ({
  id: row.id,
  title: row.title,
  slug: row.slug,
  description: row.description ?? "",
  long_description: row.long_description ?? "",
  category: row.category,
  audience_market: row.audience_market,
  image_url: row.image_url,
  shop_thumbnail_url: row.shop_thumbnail_url,
  gallery_image_urls: row.gallery_image_urls ?? [],
  sample_pdf_url: row.sample_pdf_url,
  price_cents: Number(row.price_cents ?? 0),
  currency: row.currency ?? "usd",
  stripe_payment_link: row.stripe_payment_link,
  featured: Boolean(row.featured),
  published: Boolean(row.published),
  order_index: Number(row.order_index ?? 0),
  grants_guide_access: Boolean(row.grants_guide_access),
  access_scope: row.access_scope ?? "downloads",
  tags: row.tags ?? [],
  updated_at: row.updated_at,
  created_at: row.created_at,
});

const toProductAsset = (row: ProductAssetRow): ProductAsset => ({
  id: row.id,
  product_id: row.product_id,
  title: row.title,
  file_path: row.file_path,
  file_ext: row.file_ext,
  file_size_bytes: row.file_size_bytes,
  sort_order: Number(row.sort_order ?? 0),
  is_active: Boolean(row.is_active),
  created_at: row.created_at,
});

export const getPublicProducts = async (): Promise<ProductsResult> => {
  if (!supabase) {
    return { products: [], source: "mock" };
  }

  const { data, error } = await supabase
    .schema("ghq_guides")
    .from("products")
    .select(PRODUCT_SELECT)
    .eq("published", true)
    .order("order_index", { ascending: true })
    .order("featured", { ascending: false })
    .order("updated_at", { ascending: false, nullsFirst: false });

  if (error || !data) {
    return { products: [], source: "mock" };
  }

  return {
    products: (data as ProductRow[]).map(toProduct),
    source: "products",
  };
};

export const getPublicProductBySlug = async (slug: string): Promise<Product | null> => {
  if (!supabase) return null;

  const { data, error } = await supabase
    .schema("ghq_guides")
    .from("products")
    .select(PRODUCT_SELECT)
    .eq("slug", slug)
    .eq("published", true)
    .maybeSingle();

  if (error || !data) return null;
  return toProduct(data as ProductRow);
};

export const getPublicProductAssets = async (productId: string): Promise<ProductAsset[]> => {
  if (!supabase) return [];

  const { data, error } = await supabase
    .schema("ghq_guides")
    .from("product_assets")
    .select("id, product_id, title, file_path, file_ext, file_size_bytes, sort_order, is_active, created_at")
    .eq("product_id", productId)
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  if (error || !data) return [];
  return (data as ProductAssetRow[]).map(toProductAsset);
};

export const formatProductPrice = (priceCents: number, currency = "usd") => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format((priceCents || 0) / 100);
};
