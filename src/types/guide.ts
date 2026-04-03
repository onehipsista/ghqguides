export interface Guide {
  id: string;
  title: string;
  slug: string;
  description: string;
  cover_image: string | null;
  order_index: number;
  category: string | null;
  audience_market: string | null;
  level: string | null;
  material_symbol: string | null;
  featured: boolean;
  published: boolean;
  updated_at: string | null;
}

export interface GuideSection {
  id: string;
  guide_id: string;
  title: string;
  order_index: number;
}

export interface GuideArticle {
  id: string;
  guide_id: string;
  section_id: string | null;
  title: string;
  slug: string;
  synopsis: string;
  content?: string;
  reading_time_minutes: number | null;
  order_index: number;
  published: boolean;
  updated_at: string | null;
}

export type GuidesSource = "guides" | "mock";
