export interface Post {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  tldr: string | null;
  content: string;
  cover_image: string | null;
  author: string | null;
  category: string | null;
  tags: string[];
  status: "draft" | "published";
  reading_time_minutes: number;
  published_at: string | null;
  order_index: number;
  created_at: string;
  updated_at: string;
}

export interface BlogCategory {
  id: string;
  name: string;
  slug: string;
}
