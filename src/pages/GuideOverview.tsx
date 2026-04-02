import { useMemo, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { BookOpen, ChevronDown } from "lucide-react";
import { Layout } from "@/components/Layout";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { getGuideOverviewBySlug } from "@/lib/guides";

export default function GuideOverviewPage() {
  const params = useParams();
  const slug = params.slug ?? "";

  const { data, isLoading, isError } = useQuery({
    queryKey: ["guide-overview", slug],
    queryFn: () => getGuideOverviewBySlug(slug),
    enabled: Boolean(slug),
  });

  const guide = data?.guide ?? null;

  const grouped = useMemo(() => {
    const sections = data?.sections ?? [];
    const articles = data?.articles ?? [];

    const articlesBySection = new Map<string, typeof articles>();

    sections.forEach((section) => {
      articlesBySection.set(section.id, []);
    });

    const unsectioned: typeof articles = [];

    articles.forEach((article) => {
      if (!article.section_id) {
        unsectioned.push(article);
        return;
      }

      const bucket = articlesBySection.get(article.section_id);
      if (!bucket) {
        unsectioned.push(article);
        return;
      }

      bucket.push(article);
    });

    return { articlesBySection, unsectioned };
  }, [data?.sections, data?.articles]);

  const totalReadingMinutes = useMemo(
    () => (data?.articles ?? []).reduce((sum, article) => sum + (article.reading_time_minutes ?? 1), 0),
    [data?.articles]
  );

  const [mobileTocOpen, setMobileTocOpen] = useState(false);

  if (!slug) {
    return <Navigate to="/guides" replace />;
  }

  return (
    <Layout>
      <section className="border-b bg-card">
        <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link to="/guides">Guide Library</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>{guide?.title ?? "Guide"}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {isLoading && <div className="py-16 text-center text-muted-foreground">Loading guide...</div>}

        {isError && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900">
            We couldn't load this guide right now.
          </div>
        )}

        {!isLoading && !guide && (
          <div className="py-16 text-center">
            <h1 className="font-display text-2xl font-semibold text-foreground">Guide not found</h1>
            <p className="mt-2 text-muted-foreground">This guide may be unpublished or unavailable.</p>
            <Link to="/guides" className="mt-4 inline-block text-sm font-medium text-brand-green hover:underline">
              Back to Guide Library
            </Link>
          </div>
        )}

        {guide && (
          <div className="grid gap-8 lg:grid-cols-[280px_minmax(0,1fr)]">
            <aside className="order-2 lg:order-1 lg:sticky lg:top-24 lg:self-start">
              <div className="rounded-lg border bg-card p-4 lg:max-h-[calc(100vh-7.5rem)] lg:overflow-y-auto">
                <h2 className="font-display text-lg font-semibold">In This Guide</h2>

                <div className="mt-4 hidden space-y-4 lg:block">
                  {grouped.unsectioned.length > 0 && (
                    <div>
                      <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Quick Start
                      </h3>
                      <ul className="mt-2 space-y-1.5">
                        {grouped.unsectioned.map((article) => (
                          <li key={article.id} className="text-sm text-foreground/90">
                            <Link
                              to={`/guides/${guide.slug}/${article.slug}`}
                              className="block translate-x-0 rounded-md px-2 py-1 transition-all duration-200 hover:translate-x-1 hover:bg-brand-green/5 hover:text-brand-green"
                            >
                              {article.title}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {(data?.sections ?? []).map((section) => {
                    const sectionArticles = grouped.articlesBySection.get(section.id) ?? [];

                    return (
                      <div key={section.id}>
                        <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                          {section.title}
                        </h3>
                        <ul className="mt-2 space-y-1.5">
                          {sectionArticles.length > 0 ? (
                            sectionArticles.map((article) => (
                              <li key={article.id} className="pl-3 text-sm text-foreground/90">
                                <Link
                                  to={`/guides/${guide.slug}/${article.slug}`}
                                  className="block translate-x-0 rounded-md px-2 py-1 transition-all duration-200 hover:translate-x-1 hover:bg-brand-green/5 hover:text-brand-green"
                                >
                                  {article.title}
                                </Link>
                              </li>
                            ))
                          ) : (
                            <li className="text-sm text-muted-foreground">No published articles yet.</li>
                          )}
                        </ul>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-3 lg:hidden">
                  <button
                    onClick={() => setMobileTocOpen(!mobileTocOpen)}
                    className="flex w-full items-center justify-between border-t pt-3 text-sm text-muted-foreground"
                  >
                    <span>{data?.articles?.length ?? 0} articles in this guide</span>
                    <ChevronDown
                      className={`h-4 w-4 transition-transform duration-200 ${mobileTocOpen ? "rotate-180" : ""}`}
                    />
                  </button>

                  {mobileTocOpen && (
                    <div className="mt-3 space-y-3">
                      {grouped.unsectioned.length > 0 && (
                        <div>
                          {(data?.sections?.length ?? 0) > 0 && (
                            <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                              Quick Start
                            </p>
                          )}
                          <ul className="space-y-0.5">
                            {grouped.unsectioned.map((art) => (
                              <li key={art.id}>
                                <Link
                                  to={`/guides/${guide.slug}/${art.slug}`}
                                  onClick={() => setMobileTocOpen(false)}
                                  className="block rounded-md px-2 py-1.5 text-sm text-foreground/90 hover:bg-brand-green/5 hover:text-brand-green"
                                >
                                  {art.title}
                                </Link>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {(data?.sections ?? []).map((section) => {
                        const sectionArticles = grouped.articlesBySection.get(section.id) ?? [];
                        if (!sectionArticles.length) return null;
                        return (
                          <div key={section.id}>
                            <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                              {section.title}
                            </p>
                            <ul className="space-y-0.5">
                              {sectionArticles.map((art) => (
                                <li key={art.id}>
                                  <Link
                                    to={`/guides/${guide.slug}/${art.slug}`}
                                    onClick={() => setMobileTocOpen(false)}
                                    className="block rounded-md px-2 py-1.5 pl-3 text-sm text-foreground/90 hover:bg-brand-green/5 hover:text-brand-green"
                                  >
                                    {art.title}
                                  </Link>
                                </li>
                              ))}
                            </ul>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </aside>

            <div className="order-1 lg:order-2">
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-brand-green">
                {guide.category ?? "General"}
              </p>
              <div className="mb-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1 rounded-full border bg-background px-2.5 py-1">
                  <span className="material-symbols-rounded text-sm">{guide.material_symbol ?? "menu_book"}</span>
                  {guide.level ?? "All Levels"}
                </span>
                <span className="inline-flex items-center gap-1 rounded-full border bg-background px-2.5 py-1">
                  <BookOpen className="h-3.5 w-3.5" />
                  {guide.audience_market ?? "General audience"}
                </span>
                <span className="inline-flex items-center gap-1 rounded-full border bg-background px-2.5 py-1">
                  <span className="material-symbols-rounded text-sm">schedule</span>
                  {totalReadingMinutes || 1} min read
                </span>
              </div>
              <h1 className="font-display text-3xl font-bold text-foreground sm:text-4xl">{guide.title}</h1>
              <p className="mt-4 max-w-3xl text-base leading-relaxed text-muted-foreground">
                {guide.description || "Guide overview coming soon."}
              </p>

              {guide.cover_image && (
                <div className="mt-6 overflow-hidden rounded-xl border">
                  <img src={guide.cover_image} alt={guide.title} className="h-full w-full object-cover" />
                </div>
              )}

            </div>
          </div>
        )}
      </section>
    </Layout>
  );
}
