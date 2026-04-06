import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Calendar, Clock, Share2, Tag } from "lucide-react";
import { format } from "date-fns";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { getPublicPostBySlug, getRelatedPosts } from "@/lib/posts";

const looksLikeHtml = (value: string) => /<\/?[a-z][\s\S]*>/i.test(value);

export default function BlogPostPage() {
  const { slug } = useParams<{ slug: string }>();
  const [shareMessage, setShareMessage] = useState("");

  const { data: post, isLoading } = useQuery({
    queryKey: ["public-post", slug],
    queryFn: () => getPublicPostBySlug(slug as string),
    enabled: Boolean(slug),
  });

  const { data: related = [] } = useQuery({
    queryKey: ["related-posts", slug, post?.category],
    queryFn: () => getRelatedPosts(slug as string, post?.category ?? null),
    enabled: Boolean(slug) && Boolean(post),
  });

  const normalizedContent = post?.content?.replace(/\\n/g, "\n") ?? "";
  const contentIsHtml = looksLikeHtml(normalizedContent);
  const isGraphicDesign = (post?.category ?? "").toLowerCase().includes("graphic design");

  if (isLoading) {
    return (
      <Layout>
        <div className="flex min-h-[40vh] items-center justify-center text-muted-foreground">
          Loading…
        </div>
      </Layout>
    );
  }

  if (!post) {
    return (
      <Layout>
        <div className="mx-auto max-w-3xl px-4 py-20 text-center">
          <p className="text-lg text-muted-foreground">Post not found.</p>
          <Link to="/blog" className="mt-4 inline-block text-sm text-brand-green hover:underline">
            ← Back to Blog
          </Link>
        </div>
      </Layout>
    );
  }

  const handleShare = async () => {
    const sharePayload = {
      title: post.title,
      text: post.excerpt || post.title,
      url: window.location.href,
    };

    try {
      if (navigator.share) {
        await navigator.share(sharePayload);
        setShareMessage("Shared.");
      } else {
        await navigator.clipboard.writeText(window.location.href);
        setShareMessage("Link copied.");
      }
    } catch {
      setShareMessage("Share cancelled.");
    }

    setTimeout(() => setShareMessage(""), 1800);
  };

  return (
    <Layout>
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
        {/* Breadcrumbs */}
        <nav className="mb-4 text-sm text-muted-foreground">
          <Link to="/" className="hover:text-foreground">Home</Link>
          <span className="mx-2">&gt;</span>
          <Link to="/blog" className="hover:text-foreground">Blog</Link>
          {post.category && (
            <>
              <span className="mx-2">&gt;</span>
              <span>{post.category}</span>
            </>
          )}
          <span className="mx-2">&gt;</span>
          <span className="text-foreground">{post.title}</span>
        </nav>

        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_300px]">
          <article className="rounded-xl border bg-card p-6 sm:p-10">

            {/* Back */}
            <Link
              to="/blog"
              className="mb-8 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Blog
            </Link>

            {/* Category badge */}
            {post.category && (
              <span className="mb-4 inline-block rounded-full bg-brand-green/10 px-2.5 py-0.5 text-xs font-semibold text-brand-green">
                {post.category}
              </span>
            )}

            {/* Title */}
            <h1 className="font-display text-3xl font-extrabold leading-tight tracking-tight text-foreground sm:text-4xl">
              {post.title}
            </h1>

            {/* Meta */}
            <div className="mt-4 flex flex-wrap items-center justify-between gap-4 border-b pb-6 text-sm text-muted-foreground">
              <div className="flex flex-wrap items-center gap-4">
                <span className="flex items-center gap-1.5">
                  <Clock className="h-4 w-4" />
                  {post.reading_time_minutes} min read
                </span>
                {post.published_at && (
                  <span className="flex items-center gap-1.5">
                    <Calendar className="h-4 w-4" />
                    {format(new Date(post.published_at), "MMMM d, yyyy")}
                  </span>
                )}
                {post.author && (
                  <span className="text-muted-foreground/70">by {post.author}</span>
                )}
              </div>

              <button
                type="button"
                onClick={handleShare}
                className="inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium transition-colors hover:bg-muted"
              >
                <Share2 className="h-3.5 w-3.5" />
                Share Post
              </button>
            </div>
            {shareMessage && <p className="mt-2 text-xs text-muted-foreground">{shareMessage}</p>}

            {/* Cover image */}
            {post.cover_image && (
              <div className="my-8 overflow-hidden rounded-xl">
                <img
                  src={post.cover_image}
                  alt={post.title}
                  className="aspect-[16/7] w-full object-cover"
                />
              </div>
            )}

            {/* TLDR */}
            {post.tldr && (
              <div className="mb-8 rounded-lg border border-brand-green/30 bg-brand-green/5 px-5 py-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-brand-green">TLDR</p>
                <p className="mt-1 text-lg font-bold leading-snug text-foreground">{post.tldr}</p>
              </div>
            )}

            {/* Content */}
            <div className="prose prose-sm max-w-none text-foreground sm:prose-base prose-headings:font-display prose-headings:font-bold prose-a:text-brand-green prose-a:no-underline hover:prose-a:underline prose-strong:text-foreground prose-code:rounded prose-code:bg-muted prose-code:px-1 prose-hr:my-12">
              {contentIsHtml ? (
                <div dangerouslySetInnerHTML={{ __html: normalizedContent || "<p>No content yet.</p>" }} />
              ) : (
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{normalizedContent || "No content yet."}</ReactMarkdown>
              )}
            </div>

            {/* Tags */}
            {post.tags.length > 0 && (
              <div className="mt-10 flex flex-wrap items-center gap-2 border-t pt-6">
                <Tag className="h-4 w-4 text-muted-foreground" />
                {post.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </article>

          <aside className="space-y-4">
            {related.length > 0 && (
              <div className="rounded-xl border bg-card p-4">
                <h2 className="font-display text-base font-bold text-foreground">More in this category</h2>
                <ul className="mt-3 space-y-3">
                  {related.map((item) => (
                    <li key={item.id}>
                      <Link to={`/blog/${item.slug}`} className="group block">
                        <p className="line-clamp-2 text-sm font-semibold leading-snug text-foreground group-hover:text-brand-green">
                          {item.title}
                        </p>
                        <p className="mt-0.5 text-xs text-muted-foreground">{item.reading_time_minutes} min read</p>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="rounded-xl border border-brand-green/30 bg-brand-green/5 p-4">
              <h3 className="font-display text-base font-bold text-foreground">Keep learning</h3>
              <p className="mt-1 text-xs text-muted-foreground">
                {isGraphicDesign
                  ? "For graphic design topics, continue with full guides or run a Design Check review."
                  : "Explore the guide library for deeper walkthroughs and practical examples."}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Link to="/guides">
                  <Button size="sm" variant="outline">View Guides</Button>
                </Link>
                {isGraphicDesign && (
                  <Link to="/mistakes">
                    <Button size="sm">Design Check</Button>
                  </Link>
                )}
              </div>
            </div>
          </aside>
        </div>
      </section>
    </Layout>
  );
}
