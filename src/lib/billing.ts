import { supabase } from "@/lib/supabase";

export type CheckoutMode = "hosted" | "embedded";

export interface CheckoutStartResult {
  mode: CheckoutMode;
  url: string;
}

interface EmbeddedCheckoutResponse {
  clientSecret: string;
}

const rawCheckoutMode = (import.meta.env.VITE_STRIPE_CHECKOUT_MODE ?? "hosted").toLowerCase();

export const getCheckoutMode = (): CheckoutMode =>
  rawCheckoutMode === "embedded" ? "embedded" : "hosted";

const getCurrentUserEmail = async (): Promise<string> => {
  if (!supabase) return "";

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user?.email ?? "";
};

export async function createHostedCheckoutUrl(): Promise<string> {
  const paymentLink = import.meta.env.VITE_STRIPE_PAYMENT_LINK;
  if (!paymentLink) {
    throw new Error("Missing VITE_STRIPE_PAYMENT_LINK. Set it in .env.local for local development or in Vercel Environment Variables for production.");
  }

  const email = await getCurrentUserEmail();

  const separator = paymentLink.includes("?") ? "&" : "?";
  const prefilled = email ? `${separator}prefilled_email=${encodeURIComponent(email)}` : "";

  return `${paymentLink}${prefilled}`;
}

export async function createEmbeddedCheckoutSession(): Promise<string> {
  if (!supabase) {
    throw new Error("Supabase is not configured.");
  }

  const email = await getCurrentUserEmail();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Missing Supabase environment variables.");
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    apikey: supabaseAnonKey,
  };

  if (session?.access_token) {
    headers.Authorization = `Bearer ${session.access_token}`;
  }

  const response = await fetch(`${supabaseUrl}/functions/v1/create-checkout-session`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      email,
      returnUrl: `${window.location.origin}/billing/success`,
      cancelUrl: `${window.location.origin}/billing/cancel`,
    }),
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new Error(payload?.error || "Unable to start embedded checkout.");
  }

  const payload = (await response.json()) as EmbeddedCheckoutResponse;
  if (!payload?.clientSecret) {
    throw new Error("Embedded checkout did not return a client secret.");
  }

  return payload.clientSecret;
}

export async function startGuideAccessCheckout(): Promise<CheckoutStartResult> {
  const mode = getCheckoutMode();

  if (mode === "embedded") {
    return { mode: "embedded", url: "/billing/checkout" };
  }

  const url = await createHostedCheckoutUrl();
  return { mode: "hosted", url };
}
