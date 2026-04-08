export interface Product {
  id: string;
  title: string;
  slug: string;
  description: string;
  long_description: string;
  category: string | null;
  audience_market: string | null;
  image_url: string | null;
  shop_thumbnail_url: string | null;
  gallery_image_urls: string[];
  sample_pdf_url: string | null;
  price_cents: number;
  currency: string;
  stripe_payment_link: string | null;
  featured: boolean;
  published: boolean;
  order_index: number;
  grants_guide_access: boolean;
  access_scope: "downloads" | "guides_plus_mistakes";
  tags: string[];
  updated_at: string | null;
  created_at: string | null;
}

export interface ProductAsset {
  id: string;
  product_id: string;
  title: string;
  file_path: string;
  file_ext: string | null;
  file_size_bytes: number | null;
  sort_order: number;
  is_active: boolean;
  created_at: string | null;
}

export type ProductsSource = "products" | "mock";
