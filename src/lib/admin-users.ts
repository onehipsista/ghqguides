import { supabase } from "@/lib/supabase";

export interface AdminUser {
  id: string;
  email: string | null;
  role: string | null;
  guide_access: boolean;
  created_at: string | null;
}

const assertSupabase = () => {
  if (!supabase) throw new Error("Supabase is not configured.");
  return supabase;
};

export const getAdminUsers = async (): Promise<AdminUser[]> => {
  const client = assertSupabase();

  // Uses a security-definer RPC that joins auth.users for email + created_at
  // (direct profiles select fails when those columns don't exist in the table)
  const { data, error } = await client.rpc("get_admin_users");

  if (error) throw error;

  return (data ?? []).map((row: Record<string, unknown>) => ({
    id: String(row.id ?? ""),
    email: row.email ? String(row.email) : null,
    role: row.role ? String(row.role) : null,
    guide_access: Boolean(row.guide_access),
    created_at: row.created_at ? String(row.created_at) : null,
  }));
};

export const setUserGuideAccess = async (userId: string, guideAccess: boolean): Promise<void> => {
  const client = assertSupabase();
  const { error } = await client
    .from("profiles")
    .update({ guide_access: guideAccess })
    .eq("id", userId);

  if (error) throw error;
};

export const setUserRole = async (userId: string, role: string | null): Promise<void> => {
  const client = assertSupabase();
  const { error } = await client
    .from("profiles")
    .update({ role })
    .eq("id", userId);

  if (error) throw error;
};
