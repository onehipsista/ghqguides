import { Link } from "react-router-dom";
import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";

export default function BillingSuccessPage() {
  const queryClient = useQueryClient();

  useEffect(() => {
    queryClient.invalidateQueries({ queryKey: ["access-state"] });
    queryClient.invalidateQueries({ queryKey: ["public-issues"] });
  }, [queryClient]);

  return (
    <Layout>
      <section className="mx-auto max-w-2xl px-4 py-12 text-center sm:px-6 lg:px-8">
        <h1 className="font-display text-3xl font-bold text-foreground">Payment complete</h1>
        <p className="mt-3 text-muted-foreground">
          Thanks for your purchase. Your access should unlock within a few seconds.
        </p>
        <div className="mt-6">
          <Link to="/mistakes">
            <Button size="lg">Go to Mistakes Library</Button>
          </Link>
        </div>
      </section>
    </Layout>
  );
}
