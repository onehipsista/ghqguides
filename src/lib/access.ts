import { supabase } from "@/lib/supabase";

export interface AccessState {
  isLoggedIn: boolean;
  hasGuideAccess: boolean;
  role: string | null;
  email: string | null;
}

export const getAccessState = async (): Promise<AccessState> => {
  if (!supabase) {
    return { isLoggedIn: false, hasGuideAccess: false, role: null, email: null };
  }

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.user) {
    return { isLoggedIn: false, hasGuideAccess: false, role: null, email: null };
  }

  const email = session.user.email ?? null;

  // Try with role first; fall back to just guide_access if role column doesn't exist yet
  // (PostgREST returns HTTP 400 when any selected column is missing, so we catch all errors)
  const { data, error } = await supabase
    .from("profiles")
    .select("guide_access, role")
    .eq("id", session.user.id)
    .single();

  if (error) {
    // Fallback: only request guide_access (role column may not exist)
    const { data: fallbackData } = await supabase
      .from("profiles")
      .select("guide_access")
      .eq("id", session.user.id)
      .single();

    return {
      isLoggedIn: true,
      hasGuideAccess: Boolean(fallbackData?.guide_access),
      role: null,
      email,
    };
  }

  return {
    isLoggedIn: true,
    hasGuideAccess: Boolean(data?.guide_access),
    role: data?.role ?? null,
    email,
  };
};
