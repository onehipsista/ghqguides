import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Search } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Layout } from "@/components/Layout";
import { Input } from "@/components/ui/input";
import { getPublicGuides } from "@/lib/guides";

export default function GuidesPage() {
  const [search, setSearch] = useState("");

  const { data, isLoading, isError } = useQuery({
    queryKey: ["public-guides"],
    queryFn: getPublicGuides,
  });

  const filteredGuides = useMemo(() => {
    const guides = data?.guides ?? [];

    if (!search.trim()) return guides;

    const q = search.toLowerCase();

    return guides.filter(
      (guide) =>
        guide.title.toLowerCase().includes(q) ||
        guide.description.toLowerCase().includes(q) ||
        (guide.category ?? "").toLowerCase().includes(q)
    );
  }, [data?.guides, search]);

  return (
    <Layout>
      <section className="bg-nav">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-brand-green">
            Micro Guides
          </p>
          <h1 className="font-display text-3xl font-bold text-white sm:text-4xl">
            Guide Library
          </h1>
          <p className="mt-3 max-w-2xl text-base text-nav-foreground/70">
            Practical mini-guides you can read fast and apply immediately.
          </p>

          <div className="relative mt-6 max-w-xl">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-nav-foreground/50" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search guides..."
              className="border-white/20 bg-white/5 pl-9 text-white placeholder:text-nav-foreground/50"
            />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {!isLoading && data && data.source !== "guides" && (
          <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            Guide table is not live yet. Run the Phase 2 SQL script, then add published guides.
          </div>
        )}

        {isLoading && (
          <div className="py-16 text-center text-muted-foreground">Loading guides...</div>
        )}

        {isError && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900">
            We couldn't load guides right now.
          </div>
        )}

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filteredGuides.map((guide) => (
            <article key={guide.id} className="overflow-hidden rounded-xl border bg-card">
              <Link to={`/guides/${guide.slug}`} className="block aspect-[16/9] w-full bg-muted">
                {guide.cover_image ? (
                  <img
                    src={guide.cover_image}
                    alt={guide.title}
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                    No cover image
                  </div>
                )}
              </Link>
              <div className="p-4">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <span className="text-xs uppercase tracking-wide text-muted-foreground">
                    {guide.category ?? "General"}
                  </span>
                  {guide.featured && (
                    <span className="rounded-full bg-brand-green/15 px-2 py-0.5 text-xs font-medium text-brand-green">
                      Featured
                    </span>
                  )}
                </div>

                <h2 className="font-display text-lg font-semibold text-foreground">
                  <Link to={`/guides/${guide.slug}`} className="hover:text-brand-green hover:underline">
                    {guide.title}
                  </Link>
                </h2>
                <div className="mt-2 flex flex-wrap gap-2 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1 rounded-full border bg-background px-2 py-0.5">
                    <span className="material-symbols-rounded text-sm">{guide.material_symbol ?? "menu_book"}</span>
                    {guide.level ?? "All Levels"}
                  </span>
                  {guide.audience_market && (
                    <span className="rounded-full border bg-background px-2 py-0.5">{guide.audience_market}</span>
                  )}
                </div>
                <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">{guide.description}</p>

                <Link
                  to={`/guides/${guide.slug}`}
                  className="mt-4 inline-block text-sm font-medium text-brand-green hover:underline"
                >
                  Read Guide
                </Link>
              </div>
            </article>
          ))}
        </div>

        {!isLoading && filteredGuides.length === 0 && (
          <div className="py-16 text-center text-muted-foreground">
            No guides found yet.
          </div>
        )}
      </section>
    </Layout>
  );
}
