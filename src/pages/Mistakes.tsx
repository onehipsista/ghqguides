import { useState, useMemo } from "react";
import { Search } from "lucide-react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useLocation, useNavigate } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { MistakeCard } from "@/components/MistakeCard";
import { MistakeModal } from "@/components/MistakeModal";
import { getPublicIssues } from "@/lib/design-issues";
import { getAccessState } from "@/lib/access";
import { startGuideAccessCheckout } from "@/lib/billing";
import { guideAccessPriceLabel } from "@/lib/app-config";
import type { DesignIssue, Severity } from "@/types/design-issue";
import { cn } from "@/lib/utils";

const FREE_CARD_LIMIT = 8;
const SEVERITY_FILTERS: Array<{ label: string; value: Severity | "all" }> = [
  { label: "All", value: "all" },
  { label: "Minor", value: "minor" },
  { label: "Moderate", value: "moderate" },
  { label: "Major", value: "major" },
];

export default function MistakesPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All Categories");
  const [severity, setSeverity] = useState<Severity | "all">("all");
  const [selected, setSelected] = useState<DesignIssue | null>(null);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["public-issues"],
    queryFn: getPublicIssues,
  });

  const { data: accessState } = useQuery({
    queryKey: ["access-state"],
    queryFn: getAccessState,
  });

  const hasAccess = Boolean(accessState?.hasGuideAccess);
  const isLoggedIn = Boolean(accessState?.isLoggedIn);

  const { mutate: startCheckout, isPending: isCheckoutPending } = useMutation({
    mutationFn: startGuideAccessCheckout,
    onSuccess: ({ mode, url }) => {
      if (mode === "embedded") {
        navigate(url);
        return;
      }

      window.location.href = url;
    },
  });

  const handleUpgrade = () => {
    if (!isLoggedIn) {
      navigate("/login", {
        state: {
          from: `${location.pathname}${location.search}${location.hash}`,
        },
      });
      return;
    }

    startCheckout();
  };

  const categoryOptions = useMemo(() => {
    const published = (data?.issues ?? []).filter((issue) => issue.published);
    const dynamic = Array.from(
      new Set(
        published
          .map((issue) => issue.category?.trim())
          .filter((value): value is string => Boolean(value))
      )
    ).sort((a, b) => a.localeCompare(b));

    return ["All Categories", ...dynamic];
  }, [data?.issues]);

  const filtered = useMemo(() => {
    const issues = data?.issues ?? [];
    return issues.filter((issue) => {
      if (!issue.published) return false;
      if (category !== "All Categories" && issue.category !== category) return false;
      if (severity !== "all" && issue.severity !== severity) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          issue.title.toLowerCase().includes(q) ||
          issue.body.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [data?.issues, search, category, severity]);

  const selectedIndex = useMemo(
    () => (selected ? filtered.findIndex((issue) => issue.id === selected.id) : -1),
    [filtered, selected]
  );

  const handlePrevIssue = () => {
    if (selectedIndex <= 0) return;
    setSelected(filtered[selectedIndex - 1]);
  };

  const handleNextIssue = () => {
    if (selectedIndex < 0 || selectedIndex >= filtered.length - 1) return;
    setSelected(filtered[selectedIndex + 1]);
  };

  return (
    <Layout>
      {/* Hero */}
      <section className="bg-nav">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-brand-green">
            MicroGuides
          </p>
          <h1 className="font-display text-3xl font-bold text-white sm:text-4xl">
            <span className="text-brand-green-light">Design</span> Mistakes
          </h1>
          <p className="mt-3 max-w-3xl text-base text-nav-foreground/70">
            A searchable collection of the most frequent design mistakes — with
            clear explanations and fixes available. Browse them all, so you don't make them!
          </p>

          {/* Severity legend */}
          <div className="mt-6 flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-md bg-severity-minor" />
              <span className="text-sm text-nav-foreground/60">Minor — Cosmetic Polish</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-md bg-severity-moderate" />
              <span className="text-sm text-nav-foreground/60">Moderate — Affects Usability</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-md bg-severity-major" />
              <span className="text-sm text-nav-foreground/60">Major — No Good!</span>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b bg-background">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <p className="text-lg leading-relaxed text-foreground/85 sm:text-xl">
            You don't know what you don't know when you're starting out. Most design mistakes reflect that. After reviewing real designs through my Design Check service, the same issues kept showing up. So I started documenting them. Browse the growing collection and get recommendations on what to fix.
          </p>
        </div>
      </section>

      {/* Filters */}
      <section className="border-b bg-card">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          {/* Search */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search issues..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Category pills */}
          <div className="mb-3 flex flex-wrap gap-2">
            {categoryOptions.map((cat) => (
              <Button
                key={cat}
                variant={category === cat ? "default" : "outline"}
                size="sm"
                className="h-8 rounded-md text-xs"
                onClick={() => setCategory(cat)}
              >
                {cat}
              </Button>
            ))}
          </div>

          {/* Severity pills */}
          <div className="flex flex-wrap gap-2">
            {SEVERITY_FILTERS.map((s) => (
              <Button
                key={s.value}
                variant={severity === s.value ? "default" : "outline"}
                size="sm"
                className="h-8 rounded-md text-xs"
                onClick={() => setSeverity(s.value)}
              >
                {s.value !== "all" && (
                  <span
                    className={cn(
                      "mr-1 inline-block h-2 w-2 rounded-full",
                      s.value === "minor" && "bg-severity-minor",
                      s.value === "moderate" && "bg-severity-moderate",
                      s.value === "major" && "bg-severity-major"
                    )}
                  />
                )}
                {s.label}
              </Button>
            ))}
          </div>
        </div>
      </section>

      {/* Card grid */}
      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {isLoading && (
          <div className="py-16 text-center">
            <p className="text-muted-foreground">Loading design mistakes...</p>
          </div>
        )}

        {isError && (
          <div className="py-4" />
        )}

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((issue, index) => (
            <MistakeCard
              key={issue.id}
              issue={issue}
              blurred={!hasAccess && index >= FREE_CARD_LIMIT}
              onSelect={setSelected}
            />
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="py-16 text-center">
            <p className="text-muted-foreground">No issues match your filters.</p>
          </div>
        )}

        {/* Paywall CTA */}
        {!hasAccess && filtered.length > FREE_CARD_LIMIT && (
          <div className="relative mt-8 overflow-hidden rounded-xl border border-border/80 bg-card p-8 text-center shadow-[0_4px_12px_rgba(12,34,43,0.11),0_12px_28px_rgba(12,34,43,0.09)]">
            <div className="pointer-events-none absolute -right-20 -top-16 h-64 w-64 rounded-full bg-brand-green/10 blur-2xl" />
            <span className="material-symbols-rounded mb-3 inline-flex text-3xl text-brand-green">lock</span>
            <h2 className="font-display text-xl font-bold text-foreground">
              Unlock All Design Mistakes
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              You're previewing {Math.min(FREE_CARD_LIMIT, filtered.length)} of {data?.issues?.length ?? 0} mistakes. Unlock full searchable access and all "How to Fix" solutions.
            </p>
            <Button size="lg" className="mt-4 w-full max-w-sm" onClick={handleUpgrade} disabled={isCheckoutPending}>
              Get Full Access — {guideAccessPriceLabel}
            </Button>
            <p className="mt-3 text-xs text-muted-foreground">
              Already have Design Check access? Sign in to unlock.
            </p>
          </div>
        )}
      </section>

      <MistakeModal
        issue={selected}
        open={!!selected}
        onClose={() => setSelected(null)}
        hasAccess={hasAccess}
        onUpgrade={handleUpgrade}
        isUpgrading={isCheckoutPending}
        canPrev={selectedIndex > 0}
        canNext={selectedIndex >= 0 && selectedIndex < filtered.length - 1}
        onPrev={handlePrevIssue}
        onNext={handleNextIssue}
      />
    </Layout>
  );
}
