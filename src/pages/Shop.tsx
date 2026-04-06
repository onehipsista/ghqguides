import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { Layout } from "@/components/Layout";
import { Input } from "@/components/ui/input";
import { getPublicProducts, formatProductPrice } from "@/lib/products";

export default function ShopPage() {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

  const { data, isLoading, isError } = useQuery({
    queryKey: ["public-products"],
    queryFn: getPublicProducts,
  });

  const categories = useMemo(
    () => Array.from(new Set((data?.products ?? []).map((product) => product.category).filter(Boolean))).sort(),
    [data?.products]
  );

  const filteredProducts = useMemo(() => {
    const products = data?.products ?? [];

    const categoryFiltered = products.filter((product) => {
      if (categoryFilter === "all") return true;
      return (product.category ?? "") === categoryFilter;
    });

    if (!search.trim()) return categoryFiltered;

    const q = search.toLowerCase();
    return categoryFiltered.filter(
      (product) =>
        product.title.toLowerCase().includes(q) ||
        product.description.toLowerCase().includes(q) ||
        (product.category ?? "").toLowerCase().includes(q)
    );
  }, [categoryFilter, data?.products, search]);

  return (
    <Layout>
      <section className="bg-nav">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-brand-green">
            GetHipQuick Shop
          </p>
          <h1 className="font-display text-3xl font-bold text-white sm:text-4xl">Resource Shop</h1>
          <p className="mt-3 max-w-2xl text-base text-nav-foreground/70">
            Printable PDF versions of your guides and practical templates you can use right away.
          </p>

          <div className="mt-6 flex max-w-3xl flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-nav-foreground/50" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search products..."
                className="border-white/20 bg-white/5 pl-9 text-white placeholder:text-nav-foreground/50"
              />
            </div>
            <select
              className="h-10 rounded-md border border-white/20 bg-white/5 px-3 text-sm text-white"
              value={categoryFilter}
              onChange={(event) => setCategoryFilter(event.target.value)}
            >
              <option value="all" className="text-foreground">All categories</option>
              {categories.map((category) => (
                <option key={category} value={category ?? ""} className="text-foreground">
                  {category}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {isLoading && (
          <div className="py-16 text-center text-muted-foreground">Loading products...</div>
        )}

        {isError && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900">
            We couldn't load products right now.
          </div>
        )}

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filteredProducts.map((product) => (
            <article key={product.id} className="overflow-hidden rounded-xl border bg-card">
              <Link to={`/shop/${product.slug}`} className="block aspect-[16/9] w-full bg-muted">
                {product.image_url ? (
                  <img src={product.image_url} alt={product.title} className="h-full w-full object-cover" loading="lazy" />
                ) : (
                  <div className="flex h-full items-center justify-center text-sm text-muted-foreground">No image</div>
                )}
              </Link>
              <div className="p-4">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-brand-green">
                    {product.category ?? "Resource"}
                  </span>
                  <span className="text-sm font-semibold text-foreground">
                    {formatProductPrice(product.price_cents, product.currency)}
                  </span>
                </div>

                <h2 className="font-display text-xl font-bold tracking-[-0.01em] text-foreground">
                  <Link to={`/shop/${product.slug}`} className="hover:text-brand-green hover:underline">
                    {product.title}
                  </Link>
                </h2>

                <p className="mt-3 line-clamp-3 text-sm text-foreground/85">{product.description}</p>

                <Link
                  to={`/shop/${product.slug}`}
                  className="mt-4 inline-flex rounded-[2px] border border-brand-green bg-white px-3 py-2 text-sm font-medium text-brand-teal transition-colors hover:bg-brand-green/10"
                >
                  View Product
                </Link>
              </div>
            </article>
          ))}
        </div>

        {!isLoading && filteredProducts.length === 0 && (
          <div className="py-16 text-center text-muted-foreground">No products found yet.</div>
        )}
      </section>
    </Layout>
  );
}
