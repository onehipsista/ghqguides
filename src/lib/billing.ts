import { supabase } from "@/lib/supabase";

export async function createCheckoutSession(): Promise<string> {
  const paymentLink = import.meta.env.VITE_STRIPE_PAYMENT_LINK;
  if (!paymentLink) {
    throw new Error("Missing VITE_STRIPE_PAYMENT_LINK. Set it in .env.local for local development or in Vercel Environment Variables for production.");
  }

  let email = "";
  if (supabase) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    email = user?.email ?? "";
  }

  const separator = paymentLink.includes("?") ? "&" : "?";
  const prefilled = email ? `${separator}prefilled_email=${encodeURIComponent(email)}` : "";

  return `${paymentLink}${prefilled}`;
}
