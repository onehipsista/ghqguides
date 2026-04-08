import { supabase } from "@/lib/supabase";
import type { Post, BlogCategory } from "@/types/post";

const POST_SELECT = "id, title, slug, excerpt, tldr, cover_image, author, category, tags, status, reading_time_minutes, published_at, order_index, created_at, updated_at";
const POST_SELECT_FULL = `${POST_SELECT}, content`;

const splitMultiCategory = (value: string | null | undefined): string[] => {
  if (!value) return [];
  return value
    .split(/[|,]/)
    .map((entry) => entry.trim())
    .filter(Boolean);
};

const normalizeCategoryPath = (value: string): string =>
  value
    .split(">")
    .map((segment) => segment.trim())
    .filter(Boolean)
    .join(" > ");

export const getPostCategoryPaths = (value: string | null | undefined): string[] =>
  splitMultiCategory(value)
    .map(normalizeCategoryPath)
    .filter(Boolean);

export const getPostTopLevelCategories = (value: string | null | undefined): string[] => {
  const topLevels = new Set(
    getPostCategoryPaths(value)
      .map((path) => path.split(">")[0]?.trim())
      .filter((segment): segment is string => Boolean(segment))
  );
  return Array.from(topLevels);
};

export const getPrimaryPostCategory = (value: string | null | undefined): string | null => {
  const [first] = getPostCategoryPaths(value);
  return first ?? null;
};

interface PostNavItem {
  id: string;
  slug: string;
  title: string;
}

export interface PostCategoryNavigation {
  previous: PostNavItem | null;
  next: PostNavItem | null;
}

export const getAdjacentPostsInCategory = async (
  currentSlug: string,
  category: string | null
): Promise<PostCategoryNavigation> => {
  if (!supabase || !category) {
    return { previous: null, next: null };
  }

  const { data, error } = await supabase
    .schema("ghq_guides")
    .from("posts")
    .select(POST_SELECT)
    .eq("status", "published")
    .order("published_at", { ascending: false, nullsFirst: false })
    .limit(300);

  if (error) throw error;

  const allPosts = (data as Post[] | null) ?? [];
  const currentPaths = getPostCategoryPaths(category);
  const currentTop = new Set(getPostTopLevelCategories(category));

  const exactMatches = allPosts.filter((post) => {
    const postPaths = getPostCategoryPaths(post.category);
    return postPaths.some((path) => currentPaths.includes(path));
  });

  const pool = exactMatches.length > 0
    ? exactMatches
    : allPosts.filter((post) => {
        const postTop = getPostTopLevelCategories(post.category);
        return postTop.some((segment) => currentTop.has(segment));
      });

  const currentIndex = pool.findIndex((post) => post.slug === currentSlug);
  if (currentIndex === -1) {
    return { previous: null, next: null };
  }

  const previousPost = pool[currentIndex - 1] ?? null;
  const nextPost = pool[currentIndex + 1] ?? null;

  return {
    previous: previousPost ? { id: previousPost.id, slug: previousPost.slug, title: previousPost.title } : null,
    next: nextPost ? { id: nextPost.id, slug: nextPost.slug, title: nextPost.title } : null,
  };
};

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
    .neq("slug", currentSlug)
    .order("published_at", { ascending: false, nullsFirst: false })
    .limit(60);

  if (error) throw error;

  const posts = (data as Post[] | null) ?? [];
  const currentPaths = getPostCategoryPaths(category);
  const currentTop = new Set(getPostTopLevelCategories(category));

  const scored = posts
    .map((post) => {
      const paths = getPostCategoryPaths(post.category);
      const top = new Set(getPostTopLevelCategories(post.category));

      const exactPathMatch = paths.some((path) => currentPaths.includes(path));
      const topLevelMatch = Array.from(top).some((segment) => currentTop.has(segment));

      const score = (exactPathMatch ? 2 : 0) + (topLevelMatch ? 1 : 0);
      return { post, score };
    })
    .filter((item) => item.score > 0)
    .sort((left, right) => right.score - left.score)
    .slice(0, limit)
    .map((item) => item.post);

  return scored;
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
