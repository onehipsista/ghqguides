import { supabase } from "@/lib/supabase";

export interface Category {
  id: string;
  name: string;
  slug: string;
}

const assertSupabase = () => {
  if (!supabase) {
    throw new Error("Supabase is not configured.");
  }

  return supabase;
};

export const getAdminCategories = async (): Promise<Category[]> => {
  const client = assertSupabase();

  const { data, error } = await client
    .schema("ghq_guides")
    .from("categories")
    .select("id, name, slug")
    .order("name", { ascending: true });

  if (error) throw error;
  return (data as Category[] | null) ?? [];
};

export const createCategory = async (name: string, slug: string): Promise<void> => {
  const client = assertSupabase();
  const { error } = await client.schema("ghq_guides").from("categories").insert({ name, slug });
  if (error) throw error;
};

export const updateCategory = async (id: string, name: string, slug: string): Promise<void> => {
  const client = assertSupabase();
  const { error } = await client
    .schema("ghq_guides")
    .from("categories")
    .update({ name, slug })
    .eq("id", id);

  if (error) throw error;
};

export const deleteCategory = async (id: string): Promise<void> => {
  const client = assertSupabase();
  const { error } = await client.schema("ghq_guides").from("categories").delete().eq("id", id);
  if (error) throw error;
};
