import { useMemo, useState } from "react";
import { Link, Navigate, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { EmbeddedCheckout, EmbeddedCheckoutProvider } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { getAccessState } from "@/lib/access";
import {
  createEmbeddedCheckoutSession,
  createHostedCheckoutUrl,
  getCheckoutMode,
} from "@/lib/billing";

const stripePublishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;

export default function BillingCheckoutPage() {
  const location = useLocation();
  const [isFallbackPending, setIsFallbackPending] = useState(false);

  const stripePromise = useMemo(
    () => (stripePublishableKey ? loadStripe(stripePublishableKey) : null),
    []
  );

  const { data: accessState, isLoading } = useQuery({
    queryKey: ["access-state"],
    queryFn: getAccessState,
  });

  const handleHostedFallback = async () => {
    setIsFallbackPending(true);
    try {
      const url = await createHostedCheckoutUrl();
      window.location.href = url;
    } finally {
      setIsFallbackPending(false);
    }
  };

  if (getCheckoutMode() !== "embedded") {
    return <Navigate to="/mistakes" replace />;
  }

  if (isLoading) {
    return (
      <Layout>
        <section className="mx-auto max-w-2xl px-4 py-12 text-center sm:px-6 lg:px-8">
          <p className="text-sm text-muted-foreground">Loading checkout...</p>
        </section>
      </Layout>
    );
  }

  if (!accessState?.isLoggedIn) {
    return (
      <Navigate
        to="/login"
        state={{ from: `${location.pathname}${location.search}${location.hash}` }}
        replace
      />
    );
  }

  if (accessState.hasGuideAccess) {
    return <Navigate to="/billing/success" replace />;
  }

  if (!stripePromise) {
    return (
      <Layout>
        <section className="mx-auto max-w-2xl px-4 py-12 text-center sm:px-6 lg:px-8">
          <h1 className="font-display text-3xl font-bold text-foreground">Checkout unavailable</h1>
          <p className="mt-3 text-muted-foreground">
            Embedded checkout needs a Stripe publishable key. You can still continue with secure checkout.
          </p>
          <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Button size="lg" onClick={handleHostedFallback} disabled={isFallbackPending}>
              Continue to Checkout
            </Button>
            <Link to="/mistakes">
              <Button size="lg" variant="outline">Back to Mistakes</Button>
            </Link>
          </div>
        </section>
      </Layout>
    );
  }

  return (
    <Layout>
      <section className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <h1 className="font-display text-3xl font-bold text-foreground">Complete your unlock</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Secure checkout by Stripe. Your access unlocks automatically after payment.
        </p>

        <div className="mt-6 rounded-md border bg-card p-3 shadow-sm sm:p-5">
          <EmbeddedCheckoutProvider
            stripe={stripePromise}
            options={{
              fetchClientSecret: createEmbeddedCheckoutSession,
            }}
          >
            <EmbeddedCheckout />
          </EmbeddedCheckoutProvider>
        </div>

        <p className="mt-4 text-center text-xs text-muted-foreground">
          Payment form not loading?{" "}
          <button
            type="button"
            onClick={handleHostedFallback}
            disabled={isFallbackPending}
            className="font-medium text-brand-green underline-offset-4 hover:underline disabled:opacity-70"
          >
            Use the regular payment form
          </button>
          .
        </p>
      </section>
    </Layout>
  );
}
