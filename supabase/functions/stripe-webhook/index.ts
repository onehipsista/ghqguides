import Stripe from "https://esm.sh/stripe@14.25.0?target=denonext";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.8";
import { corsHeaders } from "../_shared/cors.ts";

const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY") ?? "";
const stripeWebhookSigningSecret = Deno.env.get("STRIPE_WEBHOOK_SIGNING_SECRET") ?? "";
const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

if (!stripeSecretKey) {
  console.error("Missing STRIPE_SECRET_KEY");
}

if (!stripeWebhookSigningSecret) {
  console.error("Missing STRIPE_WEBHOOK_SIGNING_SECRET");
}

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
}

const stripe = new Stripe(stripeSecretKey, {
  apiVersion: "2024-04-10",
  httpClient: Stripe.createFetchHttpClient(),
});

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);

const grantAccessByEmail = async (email: string): Promise<void> => {
  const { error } = await supabaseAdmin.rpc("grant_guide_access_by_email", {
    p_email: email,
    p_source: "stripe_webhook",
  });

  if (error) {
    throw new Error(`Failed to grant guide access: ${error.message}`);
  }
};

Deno.serve(async (request: Request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (request.method !== "POST") {
    return new Response("Method Not Allowed", {
      status: 405,
      headers: corsHeaders,
    });
  }

  try {
    const signature = request.headers.get("stripe-signature");
    if (!signature) {
      return new Response("Missing stripe-signature", {
        status: 400,
        headers: corsHeaders,
      });
    }

    const rawBody = await request.text();
    const event = await stripe.webhooks.constructEventAsync(
      rawBody,
      signature,
      stripeWebhookSigningSecret
    );

    if (
      event.type === "checkout.session.completed" ||
      event.type === "checkout.session.async_payment_succeeded"
    ) {
      const session = event.data.object as {
        id?: string;
        customer_details?: { email?: string | null };
        customer_email?: string | null;
      };
      const email = session.customer_details?.email ?? session.customer_email ?? "";

      if (!email) {
        console.warn("No email on checkout session", { sessionId: session.id });
      } else {
        await grantAccessByEmail(email);
        console.log("Granted guide access", { email, sessionId: session.id });
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown webhook error";
    console.error("Stripe webhook failed", message);

    return new Response(JSON.stringify({ error: message }), {
      status: 400,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
    });
  }
});
