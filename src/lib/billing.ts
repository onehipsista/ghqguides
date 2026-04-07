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
  const { data, error } = await supabase.functions.invoke<EmbeddedCheckoutResponse>(
    "create-checkout-session",
    {
      body: {
        email,
        returnUrl: `${window.location.origin}/billing/success`,
        cancelUrl: `${window.location.origin}/billing/cancel`,
      },
    }
  );

  if (error) {
    throw new Error(error.message || "Unable to start embedded checkout.");
  }

  const payload = data;
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
