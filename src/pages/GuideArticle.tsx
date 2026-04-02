import { useEffect, useMemo, useState } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";
import { ChevronDown, Clock3, Lock, Users } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { getAccessState } from "@/lib/access";
import { createCheckoutSession } from "@/lib/billing";
import { getGuideArticleBySlugs } from "@/lib/guides";
import { guideAccessPriceLabel } from "@/lib/app-config";

function looksLikeHtml(value: string) {
  return /<\/?[a-z][\s\S]*>/i.test(value);
}

export default function GuideArticlePage() {
  const navigate = useNavigate();
  const params = useParams();
  const guideSlug = params.slug ?? "";
  const articleSlug = params.articleSlug ?? "";
  const [mobileTocOpen, setMobileTocOpen] = useState(false);

  const { data: accessState } = useQuery({
    queryKey: ["access-state"],
    queryFn: getAccessState,
  });

  const { data, isLoading, isError } = useQuery({
    queryKey: ["guide-article", guideSlug, articleSlug],
    queryFn: () => getGuideArticleBySlugs(guideSlug, articleSlug),
    enabled: Boolean(guideSlug && articleSlug),
    placeholderData: (previousData) => previousData,
  });

  const { mutate: startCheckout, isPending: isCheckoutPending } = useMutation({
    mutationFn: createCheckoutSession,
    onSuccess: (url) => {
      window.location.href = url;
    },
  });

  const hasAccess = Boolean(accessState?.hasGuideAccess);
  const isLoggedIn = Boolean(accessState?.isLoggedIn);

  const handleUpgrade = () => {
    if (!isLoggedIn) {
      navigate("/login");
      return;
    }

    startCheckout();
  };

  const guide = data?.guide ?? null;
  const article = data?.article ?? null;
  const section = data?.section ?? null;

  const renderedContent = useMemo(() => {
    if (!article?.content) return "";

    return article.content.trim();
  }, [article?.content]);

  useEffect(() => {
    setMobileTocOpen(false);
  }, [article?.id]);

  useEffect(() => {
    if (!article?.id) return;
    window.scrollTo({ top: 0, behavior: "auto" });
  }, [article?.id]);

  const groupedToc = useMemo(() => {
    const sections = data?.sections ?? [];
    const articles = data?.articles ?? [];

    const articlesBySection = new Map<string, typeof articles>();
    sections.forEach((item) => articlesBySection.set(item.id, []));

    const unsectioned: typeof articles = [];
    articles.forEach((item) => {
      if (!item.section_id) {
        unsectioned.push(item);
        return;
      }
      const bucket = articlesBySection.get(item.section_id);
      if (!bucket) {
        unsectioned.push(item);
        return;
      }
      bucket.push(item);
    });

    return { sections, articlesBySection, unsectioned };
  }, [data?.sections, data?.articles]);

  if (!guideSlug || !articleSlug) {
    return <Navigate to="/guides" replace />;
  }

  return (
    <Layout>
      <section className="sticky top-16 z-40 border-b bg-background/95 backdrop-blur">
        <div className="mx-auto max-w-4xl px-4 py-2 sm:px-6 lg:px-8">
          <Link to="/guides" className="text-xs font-medium text-brand-green hover:underline">
            ← Guide Library
          </Link>
        </div>
      </section>

      <section className="border-b bg-card">
        <div className="mx-auto max-w-4xl px-4 py-5 sm:px-6 lg:px-8">
          <Breadcrumb>
            <BreadcrumbList className="text-xs">
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link to="/guides">Guide Library</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link to={`/guides/${guideSlug}`}>{guide?.title ?? "Guide"}</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              {section && (
                <>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <BreadcrumbPage>{section.title}</BreadcrumbPage>
                  </BreadcrumbItem>
                </>
              )}
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>{article?.title ?? "Article"}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        {isLoading && !data && <div className="py-16 text-center text-muted-foreground">Loading article...</div>}

        {isError && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900">
            We couldn't load this article right now.
          </div>
        )}

        {!isLoading && !guide && (
          <div className="py-16 text-center">
            <h1 className="font-display text-2xl font-semibold text-foreground">Guide not found</h1>
            <Link to="/guides" className="mt-4 inline-block text-sm font-medium text-brand-green hover:underline">
              Back to Guide Library
            </Link>
          </div>
        )}

        {!isLoading && guide && !article && (
          <div className="py-16 text-center">
            <h1 className="font-display text-2xl font-semibold text-foreground">Article not found</h1>
            <Link
              to={`/guides/${guide.slug}`}
              className="mt-4 inline-block text-sm font-medium text-brand-green hover:underline"
            >
              Back to Guide Overview
            </Link>
          </div>
        )}

        {guide && article && (
          <div className="grid gap-8 lg:grid-cols-[280px_minmax(0,1fr)]">
            <aside className="hidden lg:sticky lg:top-24 lg:block lg:self-start">
              <div className="rounded-lg border bg-card p-4 lg:max-h-[calc(100vh-7.5rem)] lg:overflow-y-auto">
                <h2 className="flex items-center gap-2 font-display text-lg font-semibold">
                  <span className="material-symbols-rounded text-base text-brand-green">chrome_reader_mode</span>
                  In This Guide
                </h2>

                {groupedToc.unsectioned.length > 0 && (
                  <div className="mt-4">
                    <h3 className="text-xs font-semibold uppercase tracking-wide text-[#134960]">Quick Start</h3>
                    <ul className="mt-2 space-y-1.5">
                      {groupedToc.unsectioned.map((tocArticle) => (
                        <li key={tocArticle.id} className="text-sm text-foreground/90">
                          <Link
                            to={`/guides/${guide.slug}/${tocArticle.slug}`}
                            className={`block translate-x-0 rounded-md px-2 py-1 transition-all duration-200 hover:translate-x-1 hover:bg-brand-green/5 hover:text-brand-green ${
                              tocArticle.id === article.id ? "bg-brand-green/10 text-brand-green" : ""
                            }`}
                          >
                            {tocArticle.title}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="mt-4 space-y-4">
                  {groupedToc.sections.map((tocSection) => {
                    const sectionArticles = groupedToc.articlesBySection.get(tocSection.id) ?? [];
                    return (
                      <div key={tocSection.id}>
                        <h3 className="text-xs font-semibold uppercase tracking-wide text-[#134960]">{tocSection.title}</h3>
                        <ul className="mt-2 space-y-1.5">
                          {sectionArticles.map((tocArticle) => (
                            <li key={tocArticle.id} className="pl-3 text-sm text-foreground/90">
                              <Link
                                to={`/guides/${guide.slug}/${tocArticle.slug}`}
                                className={`block translate-x-0 rounded-md px-2 py-1 transition-all duration-200 hover:translate-x-1 hover:bg-brand-green/5 hover:text-brand-green ${
                                  tocArticle.id === article.id ? "bg-brand-green/10 text-brand-green" : ""
                                }`}
                              >
                                {tocArticle.title}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </div>
                    );
                  })}
                </div>
              </div>
            </aside>

            <article>
            {/* Mobile TOC — collapses to a single bar, mirrors desktop sticky sidebar */}
            <div className="mb-5 rounded-lg border bg-card lg:hidden">
              <button
                onClick={() => setMobileTocOpen(!mobileTocOpen)}
                className="flex w-full items-center justify-between px-4 py-3"
              >
                <span className="flex items-center gap-2 text-sm font-semibold text-foreground">
                  <span className="material-symbols-rounded text-base text-brand-green">chrome_reader_mode</span>
                  In This Guide
                </span>
                <ChevronDown
                  className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${mobileTocOpen ? "rotate-180" : ""}`}
                />
              </button>

              {mobileTocOpen && (
                <div className="space-y-3 border-t px-4 pb-4 pt-3">
                  {groupedToc.unsectioned.length > 0 && (
                    <div>
                      {groupedToc.sections.length > 0 && (
                        <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-[#134960]">
                          Quick Start
                        </p>
                      )}
                      <ul className="space-y-0.5">
                        {groupedToc.unsectioned.map((tocArticle) => (
                          <li key={tocArticle.id}>
                            <Link
                              to={`/guides/${guide.slug}/${tocArticle.slug}`}
                              onClick={() => setMobileTocOpen(false)}
                              className={`block rounded-md px-2 py-1.5 text-sm hover:bg-brand-green/5 hover:text-brand-green ${
                                tocArticle.id === article.id ? "font-medium text-brand-green" : "text-foreground/90"
                              }`}
                            >
                              {tocArticle.title}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {groupedToc.sections.map((tocSection) => {
                    const sectionArticles = groupedToc.articlesBySection.get(tocSection.id) ?? [];
                    if (!sectionArticles.length) return null;
                    return (
                      <div key={tocSection.id}>
                        <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-[#134960]">
                          {tocSection.title}
                        </p>
                        <ul className="space-y-0.5">
                          {sectionArticles.map((tocArticle) => (
                            <li key={tocArticle.id}>
                              <Link
                                to={`/guides/${guide.slug}/${tocArticle.slug}`}
                                onClick={() => setMobileTocOpen(false)}
                                className={`block rounded-md px-2 py-1.5 pl-3 text-sm hover:bg-brand-green/5 hover:text-brand-green ${
                                  tocArticle.id === article.id ? "font-medium text-brand-green" : "text-foreground/90"
                                }`}
                              >
                                {tocArticle.title}
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

            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-brand-green">
              {guide.category ?? "General"}
            </p>
            <h1 className="font-display text-3xl font-bold text-foreground sm:text-4xl">{article.title}</h1>
            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                <Clock3 className="h-3.5 w-3.5" />
                {article.reading_time_minutes ?? 1} min read
              </span>
              {guide.level && (
                <span className="inline-flex items-center gap-1">
                  <Users className="h-3.5 w-3.5" />
                  {guide.level}
                </span>
              )}
            </div>

            <div className="mt-5 flex items-center justify-between border-t border-b py-3">
              {data?.prevArticle ? (
                <Link
                  to={`/guides/${guide.slug}/${data.prevArticle.slug}`}
                  className="text-sm font-medium text-brand-green hover:underline"
                >
                  ← Previous
                </Link>
              ) : (
                <span className="text-sm text-muted-foreground">← Previous</span>
              )}

              {data?.nextArticle ? (
                <Link
                  to={`/guides/${guide.slug}/${data.nextArticle.slug}`}
                  className="text-sm font-medium text-brand-green hover:underline"
                >
                  Next: →
                </Link>
              ) : (
                <span className="text-sm text-muted-foreground">Next: →</span>
              )}
            </div>

            {!!article.synopsis && (
              <div className="mt-5 rounded-xl border bg-brand-green/5 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.1em] text-brand-green">TLDR</p>
                <p className="mt-1.5 text-sm leading-relaxed text-foreground">{article.synopsis}</p>
              </div>
            )}

            {hasAccess ? (
              <div className="mt-6 rounded-md border bg-card p-6">
                {looksLikeHtml(renderedContent) ? (
                  <div
                    className="guide-article-content whitespace-normal text-base leading-relaxed text-foreground"
                    dangerouslySetInnerHTML={{ __html: renderedContent }}
                  />
                ) : (
                  <div className="guide-article-content whitespace-normal text-base leading-relaxed text-foreground">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{renderedContent || "No content yet."}</ReactMarkdown>
                  </div>
                )}
              </div>
            ) : (
              <div className="relative mt-6 overflow-hidden rounded-md border border-border/80 bg-card p-6 shadow-[0_10px_28px_-14px_rgba(12,34,43,0.35)]">
                <div className="pointer-events-none select-none whitespace-pre-wrap text-base leading-relaxed text-foreground blur-[4px]">
                  {renderedContent || "Premium article content is available after unlock."}
                </div>
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-gradient-to-b from-background/20 via-background/80 to-background px-6 text-center backdrop-blur-sm">
                  <Lock className="h-5 w-5 text-brand-green" />
                  <h2 className="font-display text-xl font-semibold text-foreground">Unlock full article access</h2>
                  <p className="max-w-sm text-sm text-muted-foreground">
                    You’re previewing premium content. Unlock all guides, articles, and how-to walkthroughs.
                  </p>
                  <Button size="lg" className="w-full max-w-xs" onClick={handleUpgrade} disabled={isCheckoutPending}>
                    Get Access — {guideAccessPriceLabel}
                  </Button>
                </div>
              </div>
            )}

            <div className="mt-8 flex flex-col gap-3 border-t pt-6 sm:flex-row sm:items-center sm:justify-between">
              {data?.prevArticle ? (
                <Link
                  to={`/guides/${guide.slug}/${data.prevArticle.slug}`}
                  className="text-sm font-medium text-brand-green hover:underline"
                >
                  ← {data.prevArticle.title}
                </Link>
              ) : (
                <span className="text-sm text-muted-foreground">Start of guide</span>
              )}

              {data?.nextArticle ? (
                <Link
                  to={`/guides/${guide.slug}/${data.nextArticle.slug}`}
                  className="text-sm font-medium text-brand-green hover:underline"
                >
                  Next: {data.nextArticle.title} →
                </Link>
              ) : (
                <span className="text-sm text-muted-foreground">End of guide</span>
              )}
            </div>

            {(data?.relatedGuides?.length ?? 0) > 0 && (
              <div className="mt-8 rounded-xl bg-card p-5">
                <h2 className="font-display text-lg font-semibold text-foreground">Related Guides</h2>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  {data?.relatedGuides.map((relatedGuide) => (
                    <Link
                      key={relatedGuide.id}
                      to={`/guides/${relatedGuide.slug}`}
                      className="rounded-[2px] border border-[#71ba6c] bg-transparent p-3 transition-colors hover:bg-brand-green/5"
                    >
                      <p className="text-xs text-muted-foreground">{relatedGuide.category ?? "General"}</p>
                      <p className="mt-1 text-sm font-semibold text-foreground">{relatedGuide.title}</p>
                    </Link>
                  ))}
                </div>
              </div>
            )}
            </article>
          </div>
        )}
      </section>
    </Layout>
  );
}
