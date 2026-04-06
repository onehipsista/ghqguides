import { Link, Navigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, ShoppingBag } from "lucide-react";
import { Layout } from "@/components/Layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatProductPrice, getPublicProductBySlug } from "@/lib/products";

export default function ShopProductPage() {
  const params = useParams();
  const productSlug = params.slug ?? "";

  const { data: product, isLoading, isError } = useQuery({
    queryKey: ["public-product", productSlug],
    queryFn: () => getPublicProductBySlug(productSlug),
    enabled: Boolean(productSlug),
  });

  if (!productSlug) {
    return <Navigate to="/shop" replace />;
  }

  return (
    <Layout>
      <section className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <Link to="/shop" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back to shop
        </Link>

        {isLoading && <div className="py-16 text-center text-muted-foreground">Loading product...</div>}

        {isError && (
          <div className="mt-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900">
            We couldn't load this product right now.
          </div>
        )}

        {!isLoading && !product && (
          <div className="py-16 text-center">
            <h1 className="font-display text-2xl font-semibold text-foreground">Product not found</h1>
            <Link to="/shop" className="mt-4 inline-block text-sm font-medium text-brand-green hover:underline">
              Return to shop
            </Link>
          </div>
        )}

        {product && (
          <div className="mt-6 grid gap-8 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
            <div>
              <div className="overflow-hidden rounded-xl border bg-card">
                {product.image_url ? (
                  <img src={product.image_url} alt={product.title} className="aspect-[4/5] w-full object-cover" />
                ) : (
                  <div className="flex aspect-[4/5] w-full items-center justify-center bg-muted text-sm text-muted-foreground">
                    No image
                  </div>
                )}
              </div>
              {product.grants_guide_access && (
                <p className="mt-4 text-xs text-muted-foreground">
                  This product includes access to the full{" "}
                  <Link to="/guides" className="text-brand-green hover:underline">
                    Guide Library
                  </Link>
                  {" "}and{" "}
                  <Link to="/mistakes" className="text-brand-green hover:underline">
                    Design Mistakes
                  </Link>
                  {" "}content.
                </p>
              )}
            </div>

            <article className="rounded-xl border bg-card p-6">
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <Badge variant="secondary">{product.category ?? "Resource"}</Badge>
              {product.grants_guide_access && (
                <Badge className="bg-brand-green text-white hover:bg-brand-green">Includes Guide Access</Badge>
              )}
              </div>

              <h1 className="font-display text-3xl font-bold text-foreground">{product.title}</h1>
              <p className="mt-3 text-base text-muted-foreground">{product.description}</p>

              {product.long_description && (
                <div className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">
                  {product.long_description}
                </div>
              )}

              {product.tags.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {product.tags.map((tag) => (
                    <span key={tag} className="rounded-full border px-2.5 py-1 text-xs text-muted-foreground">
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              <div className="mt-6 flex items-center justify-between border-t pt-4">
                <p className="font-display text-2xl font-bold text-brand-green">
                  {formatProductPrice(product.price_cents, product.currency)}
                </p>
                {product.stripe_payment_link ? (
                  <a href={product.stripe_payment_link} target="_blank" rel="noreferrer noopener">
                    <Button size="lg" className="gap-2">
                      <ShoppingBag className="h-4 w-4" /> Buy Now                    </Button>
                  </a>
                ) : (
                  <Button size="lg" variant="outline" disabled>
                   Not available.
                  </Button>
                )}
              </div>

              {product.grants_guide_access && (
                <p className="mt-3 text-xs text-muted-foreground">
                  This product includes access to the full Guide Library and Design Mistakes content.
                </p>
              )}
            </article>
          </div>
        )}
      </section>
    </Layout>
  );
}
