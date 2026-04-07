import Stripe from "https://deno.land/x/stripe@v1.4.0/mod.ts";
import { corsHeaders } from "../_shared/cors.ts";

const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY") ?? "";
const stripeGuideAccessPriceId = Deno.env.get("STRIPE_GUIDE_ACCESS_PRICE_ID") ?? "";
const siteUrl = Deno.env.get("SITE_URL") ?? "";

const stripe = new Stripe(stripeSecretKey, {
	apiVersion: "2024-04-10",
	httpClient: Stripe.createFetchHttpClient(),
});

interface CheckoutRequest {
	email?: string;
	returnUrl?: string;
	cancelUrl?: string;
}

const getOriginFromUrl = (value?: string): string | null => {
	if (!value) return null;
	try {
		return new URL(value).origin;
	} catch {
		return null;
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

	if (!stripeSecretKey || !stripeGuideAccessPriceId) {
		return new Response(
			JSON.stringify({ error: "Stripe checkout is not configured." }),
			{
				status: 500,
				headers: {
					...corsHeaders,
					"Content-Type": "application/json",
				},
			}
		);
	}

	try {
		const body = (await request.json()) as CheckoutRequest;

		const requestOrigin = request.headers.get("origin") ?? "";
		const originFromReturn = getOriginFromUrl(body.returnUrl);
		const originFromCancel = getOriginFromUrl(body.cancelUrl);
		const fallbackOrigin = getOriginFromUrl(siteUrl);
		const requestOriginCandidate = requestOrigin || null;
		const origin = originFromReturn ?? originFromCancel ?? requestOriginCandidate ?? fallbackOrigin;

		if (!origin) {
			return new Response(
				JSON.stringify({ error: "Unable to determine checkout return origin." }),
				{
					status: 400,
					headers: {
						...corsHeaders,
						"Content-Type": "application/json",
					},
				}
			);
		}

		const successUrl = `${origin}/billing/success?session_id={CHECKOUT_SESSION_ID}`;
		const cancelUrl = `${origin}/billing/cancel`;

		const session = await stripe.checkout.sessions.create({
			mode: "payment",
			ui_mode: "embedded",
			line_items: [{ price: stripeGuideAccessPriceId, quantity: 1 }],
			customer_email: body.email,
			return_url: successUrl,
			redirect_on_completion: "always",
			metadata: {
				product: "guide_access",
			},
			payment_intent_data: {
				metadata: {
					product: "guide_access",
				},
			},
		});

		if (!session.client_secret) {
			return new Response(
				JSON.stringify({ error: "Stripe did not return an embedded client secret." }),
				{
					status: 500,
					headers: {
						...corsHeaders,
						"Content-Type": "application/json",
					},
				}
			);
		}

		return new Response(
			JSON.stringify({ clientSecret: session.client_secret }),
			{
				status: 200,
				headers: {
					...corsHeaders,
					"Content-Type": "application/json",
				},
			}
		);
	} catch (error) {
		const message = error instanceof Error ? error.message : "Unable to create checkout session.";

		return new Response(JSON.stringify({ error: message }), {
			status: 400,
			headers: {
				...corsHeaders,
				"Content-Type": "application/json",
			},
		});
	}
});
