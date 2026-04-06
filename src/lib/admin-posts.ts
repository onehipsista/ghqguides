import { supabase } from "@/lib/supabase";
import type { Post, BlogCategory } from "@/types/post";

const assertSupabase = () => {
  if (!supabase) throw new Error("Supabase is not configured.");
  return supabase;
};

// ---------------------------------------------------------------------------
// Admin post input type
// ---------------------------------------------------------------------------

export interface AdminPostInput {
  id?: string;
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
}

// ---------------------------------------------------------------------------
// Posts
// ---------------------------------------------------------------------------

export const getAdminPosts = async (): Promise<Post[]> => {
  const client = assertSupabase();

  const { data, error } = await client
    .schema("ghq_guides")
    .from("posts")
    .select("id, title, slug, excerpt, tldr, cover_image, author, category, tags, status, reading_time_minutes, published_at, order_index, created_at, updated_at")
    .order("order_index", { ascending: true })
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data as Post[] | null) ?? [];
};

export const getAdminPostById = async (id: string): Promise<Post | null> => {
  const client = assertSupabase();

  const { data, error } = await client
    .schema("ghq_guides")
    .from("posts")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;
  return data as Post | null;
};

export const saveAdminPost = async (input: AdminPostInput): Promise<void> => {
  const client = assertSupabase();

  const payload = {
    title: input.title,
    slug: input.slug,
    excerpt: input.excerpt,
    tldr: input.tldr,
    content: input.content,
    cover_image: input.cover_image,
    author: input.author,
    category: input.category,
    tags: input.tags,
    status: input.status,
    reading_time_minutes: input.reading_time_minutes,
    published_at: input.status === "published"
      ? (input.published_at ?? new Date().toISOString())
      : input.published_at,
    order_index: input.order_index,
    updated_at: new Date().toISOString(),
  };

  if (input.id) {
    const { error } = await client
      .schema("ghq_guides")
      .from("posts")
      .update(payload)
      .eq("id", input.id);
    if (error) throw error;
  } else {
    const { error } = await client
      .schema("ghq_guides")
      .from("posts")
      .insert(payload);
    if (error) throw error;
  }
};

export const deleteAdminPost = async (id: string): Promise<void> => {
  const client = assertSupabase();
  const { error } = await client.schema("ghq_guides").from("posts").delete().eq("id", id);
  if (error) throw error;
};

export const duplicateAdminPost = async (id: string): Promise<void> => {
  const client = assertSupabase();
  const source = await getAdminPostById(id);
  if (!source) throw new Error("Post not found.");

  const copySlug = `${source.slug}-copy-${Math.random().toString(36).slice(2, 7)}`;

  const { error } = await client
    .schema("ghq_guides")
    .from("posts")
    .insert({
      title: `${source.title} (Copy)`,
      slug: copySlug,
      excerpt: source.excerpt,
      tldr: source.tldr,
      content: source.content,
      cover_image: source.cover_image,
      author: source.author,
      category: source.category,
      tags: source.tags,
      status: "draft",
      reading_time_minutes: source.reading_time_minutes,
      published_at: null,
      order_index: source.order_index,
      updated_at: new Date().toISOString(),
    });

  if (error) throw error;
};

// ---------------------------------------------------------------------------
// Blog categories
// ---------------------------------------------------------------------------

export const getAdminBlogCategories = async (): Promise<BlogCategory[]> => {
  const client = assertSupabase();

  const { data, error } = await client
    .schema("ghq_guides")
    .from("blog_categories")
    .select("id, name, slug")
    .order("name", { ascending: true });

  if (error) throw error;
  return (data as BlogCategory[] | null) ?? [];
};

export const saveAdminBlogCategory = async (
  name: string,
  slug: string,
  id?: string
): Promise<void> => {
  const client = assertSupabase();

  if (id) {
    const { error } = await client
      .schema("ghq_guides")
      .from("blog_categories")
      .update({ name, slug })
      .eq("id", id);
    if (error) throw error;
  } else {
    const { error } = await client
      .schema("ghq_guides")
      .from("blog_categories")
      .insert({ name, slug });
    if (error) throw error;
  }
};

export const deleteAdminBlogCategory = async (id: string): Promise<void> => {
  const client = assertSupabase();
  const { error } = await client
    .schema("ghq_guides")
    .from("blog_categories")
    .delete()
    .eq("id", id);
  if (error) throw error;
};
