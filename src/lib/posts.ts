import { supabase } from "@/lib/supabase";
import type { Post, BlogCategory } from "@/types/post";

const POST_SELECT = "id, title, slug, excerpt, tldr, cover_image, author, category, tags, status, reading_time_minutes, published_at, order_index, created_at, updated_at";
const POST_SELECT_FULL = `${POST_SELECT}, content`;

// ---------------------------------------------------------------------------
// Public queries (published only)
// ---------------------------------------------------------------------------

export const getPublicPosts = async (category?: string): Promise<Post[]> => {
  if (!supabase) return [];

  let query = supabase
    .schema("ghq_guides")
    .from("posts")
    .select(POST_SELECT)
    .eq("status", "published")
    .order("published_at", { ascending: false, nullsFirst: false });

  if (category) {
    query = query.eq("category", category);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data as Post[] | null) ?? [];
};

export const getPublicPostBySlug = async (slug: string): Promise<Post | null> => {
  if (!supabase) return null;

  const { data, error } = await supabase
    .schema("ghq_guides")
    .from("posts")
    .select(POST_SELECT_FULL)
    .eq("status", "published")
    .eq("slug", slug)
    .maybeSingle();

  if (error) throw error;
  return data as Post | null;
};

export const getRelatedPosts = async (
  currentSlug: string,
  category: string | null,
  limit = 3
): Promise<Post[]> => {
  if (!supabase || !category) return [];

  const { data, error } = await supabase
    .schema("ghq_guides")
    .from("posts")
    .select(POST_SELECT)
    .eq("status", "published")
    .eq("category", category)
    .neq("slug", currentSlug)
    .order("published_at", { ascending: false, nullsFirst: false })
    .limit(limit);

  if (error) throw error;
  return (data as Post[] | null) ?? [];
};

export const getPublicBlogCategories = async (): Promise<BlogCategory[]> => {
  if (!supabase) return [];

  const { data, error } = await supabase
    .schema("ghq_guides")
    .from("blog_categories")
    .select("id, name, slug")
    .order("name", { ascending: true });

  if (error) throw error;
  return (data as BlogCategory[] | null) ?? [];
};
