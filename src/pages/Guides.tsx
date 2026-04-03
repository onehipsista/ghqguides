import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Search, Users } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Layout } from "@/components/Layout";
import { Input } from "@/components/ui/input";
import { getPublicGuides } from "@/lib/guides";
import { getVersionedMediaUrl } from "@/lib/media";

export default function GuidesPage() {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

  const { data, isLoading, isError } = useQuery({
    queryKey: ["public-guides"],
    queryFn: getPublicGuides,
  });

  const categories = useMemo(
    () => Array.from(new Set((data?.guides ?? []).map((guide) => guide.category).filter(Boolean))).sort(),
    [data?.guides]
  );

  const filteredGuides = useMemo(() => {
    const guides = data?.guides ?? [];

    const categoryFiltered = guides.filter((guide) => {
      if (categoryFilter === "all") return true;
      return (guide.category ?? "") === categoryFilter;
    });

    if (!search.trim()) return categoryFiltered;

    const q = search.toLowerCase();

    return categoryFiltered.filter(
      (guide) =>
        guide.title.toLowerCase().includes(q) ||
        guide.description.toLowerCase().includes(q) ||
        (guide.category ?? "").toLowerCase().includes(q)
    );
  }, [categoryFilter, data?.guides, search]);

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

          <div className="mt-6 flex max-w-3xl flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-nav-foreground/50" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search guides..."
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
                    src={getVersionedMediaUrl(guide.cover_image, guide.updated_at)}
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
                  <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-brand-green">
                    {guide.category ?? "General"}
                  </span>
                  {guide.featured && (
                    <span className="rounded-full bg-brand-green/15 px-2 py-0.5 text-xs font-medium text-brand-green">
                      Featured
                    </span>
                  )}
                </div>

                <h2 className="font-display text-xl font-bold tracking-[-0.01em] text-foreground">
                  <Link to={`/guides/${guide.slug}`} className="hover:text-brand-green hover:underline">
                    {guide.title}
                  </Link>
                </h2>
                <div className="mt-2 flex flex-wrap gap-2 text-xs text-muted-foreground">
                  <span>{guide.level ?? "All Levels"}</span>
                  {guide.audience_market && (
                    <>
                      <span className="text-border">|</span>
                      <span className="inline-flex items-center gap-1">
                        <Users className="h-3.5 w-3.5" />
                        {guide.audience_market}
                      </span>
                    </>
                  )}
                </div>
                <div className="mt-3 border-t border-[#dde8e2]" />
                <p className="mt-3 line-clamp-3 text-sm text-foreground/85">{guide.description}</p>

                <Link
                  to={`/guides/${guide.slug}`}
                  className="mt-4 inline-flex rounded-md bg-brand-teal px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-[#10313d]"
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
