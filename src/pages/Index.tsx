import { Link } from "react-router-dom";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, BookOpen, Compass, PenLine, ShoppingBag, Sparkles } from "lucide-react";
import { Layout } from "@/components/Layout";
import { getPublicGuides } from "@/lib/guides";
import { getVersionedMediaUrl } from "@/lib/media";

const AUDIENCES = [
  { id: "all", label: "Everyone" },
  { id: "Canva Users", label: "Canva Users" },
  { id: "Small Businesses", label: "Small Businesses" },
  { id: "Solopreneurs", label: "Solopreneurs" },
  { id: "Nonprofit Leaders", label: "Nonprofit Leaders" },
  { id: "Non-Designers", label: "Non-Designers" },
];

const ECOSYSTEM_AREAS = [
  {
    id: "microguides",
    title: "MicroGuides",
    description: "Bite-sized, actionable guides built for non-designers who want pro results fast.",
    href: "/guides",
    icon: Sparkles,
  },
  {
    id: "shop",
    title: "Resource Shop",
    description: "PDF versions and printable resources sold directly through Stripe checkout.",
    href: "/shop",
    icon: ShoppingBag,
  },
  {
    id: "design-reviews",
    title: "Design Reviews",
    description: "Get clear, practical feedback on your design work. (Service page coming soon)",
    href: "/mistakes",
    icon: PenLine,
  },
  {
    id: "blog-topics",
    title: "Blog Topics",
    description: "Practical tips and explainers. For now, discover content through search and guides.",
    href: "/search",
    icon: BookOpen,
  },
];

export default function Index() {
  const [audience, setAudience] = useState("all");

  const { data: guidesResult } = useQuery({
    queryKey: ["public-guides"],
    queryFn: getPublicGuides,
  });

  const spotlight = useMemo(() => {
    const guides = guidesResult?.guides ?? [];

    const audienceFiltered =
      audience === "all" ? guides : guides.filter((guide) => (guide.audience_market ?? "") === audience);

    return audienceFiltered.slice(0, 4);
  }, [audience, guidesResult?.guides]);

  return (
    <Layout>
      <section className="border-b bg-background">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-brand-green">GetHipQuick</p>
          <h1 className="mt-3 max-w-4xl font-display text-4xl font-bold tracking-tight text-foreground sm:text-6xl">
             Explore microguides, printable resources, and get real design help.
          </h1>
          <p className="mt-5 max-w-4xl text-lg text-muted-foreground">
            Our resources are made for Canva/aspiring creatives, small business owners, entrepreneurs, and nonprofits who haven’t the time (or patience) to take dedicated courses or sift through long docs and manuals. Check out the growing library of articles, microguides, and checklists.
          </p>

          <div className="mt-8 flex flex-wrap gap-2">
            {AUDIENCES.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setAudience(item.id)}
                className={`rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
                  audience === item.id
                    ? "border-brand-green bg-brand-green text-white"
                    : "border-border bg-white text-foreground/80 hover:border-brand-green/50"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-center justify-between gap-4">
          <h2 className="font-display text-2xl font-semibold text-foreground">Curated for {audience === "all" ? "Everyone" : audience}</h2>
          <Link to="/guides" className="inline-flex items-center gap-1 text-sm font-medium text-brand-green hover:underline">
            View all guides <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {spotlight.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {spotlight.map((guide) => (
              <Link
                to={`/guides/${guide.slug}`}
                key={guide.id}
                className="group overflow-hidden rounded-xl border bg-card transition-colors hover:border-brand-green/50"
              >
                <div className="aspect-[16/10] bg-muted">
                  {guide.cover_image ? (
                    <img
                      src={getVersionedMediaUrl(guide.cover_image, guide.updated_at)}
                      alt={guide.title}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">No cover image</div>
                  )}
                </div>
                <div className="p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-brand-green">
                    {guide.category ?? "Guide"}
                  </p>
                  <h3 className="mt-1 line-clamp-2 text-base font-semibold text-foreground group-hover:text-brand-green">
                    {guide.title}
                  </h3>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed p-6 text-sm text-muted-foreground">
            No guides match this audience yet. Try another audience filter.
          </div>
        )}
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
        <div className="mb-8 text-center">
          <h2 className="font-display text-3xl font-bold text-foreground">Explore the ecosystem</h2>
          <p className="mt-2 text-muted-foreground">Pick where you want to start.</p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          {ECOSYSTEM_AREAS.map((area) => {
            const Icon = area.icon;
            return (
              <Link
                key={area.id}
                to={area.href}
                className="group rounded-2xl border bg-card p-7 transition-colors hover:border-brand-green/50"
              >
                <div className="mb-5 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-brand-green/10 text-brand-green">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="font-display text-2xl font-bold text-foreground">{area.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{area.description}</p>
                <span className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-brand-green group-hover:gap-2">
                  Explore <Compass className="h-4 w-4" />
                </span>
              </Link>
            );
          })}
        </div>
      </section>
    </Layout>
  );
}
