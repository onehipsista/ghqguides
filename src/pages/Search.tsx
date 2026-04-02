import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Search as SearchIcon } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Layout } from "@/components/Layout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { searchPublicContent } from "@/lib/search";

const previewText = (value: string, max = 140) => {
  if (value.length <= max) return value;
  return `${value.slice(0, max).trimEnd()}...`;
};

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQ = searchParams.get("q") ?? "";
  const [input, setInput] = useState(initialQ);

  const normalizedQ = useMemo(() => initialQ.trim(), [initialQ]);

  const { data, isLoading } = useQuery({
    queryKey: ["global-search", normalizedQ],
    queryFn: () => searchPublicContent(normalizedQ),
    enabled: normalizedQ.length > 0,
  });

  const totalResults = (data?.issues.length ?? 0) + (data?.guides.length ?? 0) + (data?.articles.length ?? 0);

  const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const q = input.trim();
    if (!q) {
      setSearchParams({});
      return;
    }

    setSearchParams({ q });
  };

  return (
    <Layout>
      <section className="bg-nav">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-brand-green">Global Search</p>
          <h1 className="font-display text-3xl font-bold text-white sm:text-4xl">Search Mistakes + Guides</h1>

          <form onSubmit={onSubmit} className="relative mt-6 max-w-2xl">
            <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-nav-foreground/50" />
            <Input
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Search by keyword..."
              className="border-white/20 bg-white/5 pl-9 text-white placeholder:text-nav-foreground/50"
            />
            <Button type="submit" className="mt-3" size="sm">
              Search
            </Button>
          </form>

          {normalizedQ && (
            <p className="mt-4 text-sm text-nav-foreground/70">
              Results for <span className="font-semibold text-white">“{normalizedQ}”</span>
            </p>
          )}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {!normalizedQ && (
          <div className="rounded-lg border bg-card p-5 text-sm text-muted-foreground">
            Enter a keyword to search across issues, guides, and articles.
          </div>
        )}

        {normalizedQ && isLoading && (
          <div className="py-10 text-center text-muted-foreground">Searching...</div>
        )}

        {normalizedQ && !isLoading && (
          <>
            <p className="mb-4 text-sm text-muted-foreground">{totalResults} result(s)</p>

            <div className="space-y-8">
              <div>
                <h2 className="font-display text-xl font-semibold text-foreground">Issues</h2>
                <div className="mt-3 space-y-3">
                  {(data?.issues ?? []).map((issue) => (
                    <article key={issue.id} className="rounded-lg border bg-card p-4">
                      <div className="mb-2 flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{issue.category}</span>
                        <span>•</span>
                        <span className="capitalize">{issue.severity}</span>
                      </div>
                      <h3 className="font-semibold text-foreground">{issue.title}</h3>
                      <p className="mt-1 text-sm text-muted-foreground">{previewText(issue.body)}</p>
                      <Link to="/mistakes" className="mt-3 inline-block text-sm font-medium text-brand-green hover:underline">
                        Open in Mistakes
                      </Link>
                    </article>
                  ))}
                  {(data?.issues ?? []).length === 0 && (
                    <p className="text-sm text-muted-foreground">No issue matches.</p>
                  )}
                </div>
              </div>

              <div>
                <h2 className="font-display text-xl font-semibold text-foreground">Guides</h2>
                <div className="mt-3 space-y-3">
                  {(data?.guides ?? []).map((guide) => (
                    <article key={guide.id} className="rounded-lg border bg-card p-4">
                      <div className="mb-2 text-xs text-muted-foreground">{guide.category ?? "General"}</div>
                      <h3 className="font-semibold text-foreground">{guide.title}</h3>
                      <p className="mt-1 text-sm text-muted-foreground">{previewText(guide.description || "")}</p>
                      <Link
                        to={`/guides/${guide.slug}`}
                        className="mt-3 inline-block text-sm font-medium text-brand-green hover:underline"
                      >
                        Open Guide
                      </Link>
                    </article>
                  ))}
                  {(data?.guides ?? []).length === 0 && (
                    <p className="text-sm text-muted-foreground">No guide matches.</p>
                  )}
                </div>
              </div>

              <div>
                <h2 className="font-display text-xl font-semibold text-foreground">Articles</h2>
                <div className="mt-3 space-y-3">
                  {(data?.articles ?? []).map((article) => (
                    <article key={article.id} className="rounded-lg border bg-card p-4">
                      <div className="mb-2 text-xs text-muted-foreground">{article.guideTitle}</div>
                      <h3 className="font-semibold text-foreground">{article.title}</h3>
                      <Link
                        to={`/guides/${article.guideSlug}/${article.slug}`}
                        className="mt-3 inline-block text-sm font-medium text-brand-green hover:underline"
                      >
                        Open Article
                      </Link>
                    </article>
                  ))}
                  {(data?.articles ?? []).length === 0 && (
                    <p className="text-sm text-muted-foreground">No article matches.</p>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </section>
    </Layout>
  );
}
