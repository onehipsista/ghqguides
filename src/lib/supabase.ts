import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const rawAdminEmails = import.meta.env.VITE_ADMIN_EMAILS ?? "";

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const adminEmailAllowlist = rawAdminEmails
  .split(",")
  .map((email) => email.trim().toLowerCase())
  .filter(Boolean);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;
