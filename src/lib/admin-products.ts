import { supabase } from "@/lib/supabase";
import type { Product, ProductAsset } from "@/types/product";

export interface AdminProductInput {
  id?: string;
  title: string;
  slug: string;
  description: string;
  long_description: string;
  category: string | null;
  audience_market: string | null;
  image_url: string | null;
  price_cents: number;
  currency: string;
  stripe_payment_link: string | null;
  featured: boolean;
  published: boolean;
  order_index: number;
  grants_guide_access: boolean;
  access_scope: "downloads" | "guides_plus_mistakes";
  tags: string[];
}

export interface AdminProductAssetInput {
  id?: string;
  product_id: string;
  title: string;
  file_path: string;
  file_ext: string | null;
  file_size_bytes: number | null;
  sort_order: number;
  is_active: boolean;
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
  "id, title, slug, description, long_description, category, audience_market, image_url, price_cents, currency, stripe_payment_link, featured, published, order_index, grants_guide_access, access_scope, tags, updated_at, created_at";

const assertSupabase = () => {
  if (!supabase) {
    throw new Error("Supabase is not configured.");
  }
  return supabase;
};

const toProduct = (row: ProductRow): Product => ({
  id: row.id,
  title: row.title,
  slug: row.slug,
  description: row.description ?? "",
  long_description: row.long_description ?? "",
  category: row.category,
  audience_market: row.audience_market,
  image_url: row.image_url,
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

const toAsset = (row: ProductAssetRow): ProductAsset => ({
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

export const getAdminProducts = async (): Promise<Product[]> => {
  const client = assertSupabase();
  const { data, error } = await client
    .schema("ghq_guides")
    .from("products")
    .select(PRODUCT_SELECT)
    .order("order_index", { ascending: true })
    .order("updated_at", { ascending: false, nullsFirst: false });

  if (error) throw error;
  return (data as ProductRow[] | null)?.map(toProduct) ?? [];
};

export const getAdminProductById = async (id: string): Promise<Product | null> => {
  const client = assertSupabase();
  const { data, error } = await client
    .schema("ghq_guides")
    .from("products")
    .select(PRODUCT_SELECT)
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;
  return data ? toProduct(data as ProductRow) : null;
};

export const saveAdminProduct = async (input: AdminProductInput): Promise<void> => {
  const client = assertSupabase();
  const payload = {
    title: input.title,
    slug: input.slug,
    description: input.description,
    long_description: input.long_description,
    category: input.category,
    audience_market: input.audience_market,
    image_url: input.image_url,
    price_cents: input.price_cents,
    currency: input.currency || "usd",
    stripe_payment_link: input.stripe_payment_link,
    featured: input.featured,
    published: input.published,
    order_index: input.order_index,
    grants_guide_access: input.grants_guide_access,
    access_scope: input.access_scope,
    tags: input.tags,
    updated_at: new Date().toISOString(),
  };

  if (input.id) {
    const { error } = await client
      .schema("ghq_guides")
      .from("products")
      .update(payload)
      .eq("id", input.id);

    if (error) throw error;
    return;
  }

  const { error } = await client.schema("ghq_guides").from("products").insert(payload);
  if (error) throw error;
};

export const duplicateAdminProduct = async (id: string): Promise<void> => {
  const client = assertSupabase();
  const source = await getAdminProductById(id);

  if (!source) {
    throw new Error("Product not found.");
  }

  const copySlug = `${source.slug}-copy-${Math.random().toString(36).slice(2, 7)}`;

  const { error } = await client
    .schema("ghq_guides")
    .from("products")
    .insert({
      title: `${source.title} (Copy)`,
      slug: copySlug,
      description: source.description,
      long_description: source.long_description,
      category: source.category,
      audience_market: source.audience_market,
      image_url: source.image_url,
      price_cents: source.price_cents,
      currency: source.currency,
      stripe_payment_link: source.stripe_payment_link,
      featured: false,
      published: false,
      order_index: source.order_index,
      grants_guide_access: source.grants_guide_access,
      access_scope: source.access_scope,
      tags: source.tags,
      updated_at: new Date().toISOString(),
    });

  if (error) throw error;
};

export const deleteAdminProduct = async (id: string): Promise<void> => {
  const client = assertSupabase();
  const { error } = await client.schema("ghq_guides").from("products").delete().eq("id", id);
  if (error) throw error;
};

export const getAdminProductAssets = async (productId: string): Promise<ProductAsset[]> => {
  const client = assertSupabase();
  const { data, error } = await client
    .schema("ghq_guides")
    .from("product_assets")
    .select("id, product_id, title, file_path, file_ext, file_size_bytes, sort_order, is_active, created_at")
    .eq("product_id", productId)
    .order("sort_order", { ascending: true });

  if (error) throw error;
  return (data as ProductAssetRow[] | null)?.map(toAsset) ?? [];
};

export const saveAdminProductAsset = async (input: AdminProductAssetInput): Promise<void> => {
  const client = assertSupabase();
  const payload = {
    product_id: input.product_id,
    title: input.title,
    file_path: input.file_path,
    file_ext: input.file_ext,
    file_size_bytes: input.file_size_bytes,
    sort_order: input.sort_order,
    is_active: input.is_active,
  };

  if (input.id) {
    const { error } = await client
      .schema("ghq_guides")
      .from("product_assets")
      .update(payload)
      .eq("id", input.id);
    if (error) throw error;
    return;
  }

  const { error } = await client.schema("ghq_guides").from("product_assets").insert(payload);
  if (error) throw error;
};

export const deleteAdminProductAsset = async (id: string): Promise<void> => {
  const client = assertSupabase();
  const { error } = await client.schema("ghq_guides").from("product_assets").delete().eq("id", id);
  if (error) throw error;
};
