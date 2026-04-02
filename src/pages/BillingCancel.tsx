import { Link } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";

export default function BillingCancelPage() {
  return (
    <Layout>
      <section className="mx-auto max-w-2xl px-4 py-12 text-center sm:px-6 lg:px-8">
        <h1 className="font-display text-3xl font-bold text-foreground">Checkout canceled</h1>
        <p className="mt-3 text-muted-foreground">
          No payment was made. You can try again any time.
        </p>
        <div className="mt-6">
          <Link to="/mistakes">
            <Button size="lg" variant="outline">
              Back to Mistakes
            </Button>
          </Link>
        </div>
      </section>
    </Layout>
  );
}
