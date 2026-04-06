import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Calendar, Clock, Tag } from "lucide-react";
import { format } from "date-fns";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { getPublicPosts } from "@/lib/posts";
import { cn } from "@/lib/utils";

export default function BlogPage() {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const { data: posts = [], isLoading } = useQuery({
    queryKey: ["public-posts", activeCategory],
    queryFn: () => getPublicPosts(activeCategory ?? undefined),
  });

  const categories = Array.from(
    new Set(posts.map((post) => post.category).filter((value): value is string => Boolean(value)))
  );

  const recentPosts = posts.slice(0, 4);

  return (
    <Layout>
      {/* Hero */}
      <section className="bg-nav">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-brand-green">Blog</p>
          <h1 className="font-display text-3xl font-bold text-white sm:text-4xl">
            Practical design tips &amp; guides
          </h1>
          <p className="mt-3 max-w-xl text-base text-nav-foreground/70">
            Short, actionable reads for non-designers, small business owners, and anyone who makes things look good.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-10 lg:flex-row">

          {/* ── Post list ── */}
          <main className="min-w-0 flex-1">
            {isLoading ? (
              <div className="py-16 text-center text-muted-foreground">Loading posts...</div>
            ) : posts.length === 0 ? (
              <div className="rounded-xl border bg-card p-8 text-center text-muted-foreground">
                No posts published yet. Check back soon.
              </div>
            ) : (
              <div className="space-y-5">
                {posts.map((post) => (
                  <Link key={post.id} to={`/blog/${post.slug}`} className="group block">
                    <article className="flex gap-5 overflow-hidden rounded-xl border bg-card p-4 transition-colors hover:border-brand-green/50 sm:p-5">
                      {post.cover_image && (
                        <img
                          src={post.cover_image}
                          alt={post.title}
                          className="hidden h-28 w-44 shrink-0 rounded-lg object-cover sm:block"
                        />
                      )}
                      <div className="min-w-0 flex-1">
                        {post.category && (
                          <span className="mb-1.5 inline-block rounded-full bg-brand-green/10 px-2.5 py-0.5 text-xs font-semibold text-brand-green">
                            {post.category}
                          </span>
                        )}
                        <h2 className="font-display text-lg font-bold leading-snug text-foreground group-hover:text-brand-green sm:text-xl">
                          {post.title}
                        </h2>
                        {post.excerpt && (
                          <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{post.excerpt}</p>
                        )}
                        <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                          {post.published_at && (
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {format(new Date(post.published_at), "MMM d, yyyy")}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {post.reading_time_minutes} min read
                          </span>
                          {post.author && (
                            <span className="text-muted-foreground/70">by {post.author}</span>
                          )}
                        </div>
                      </div>
                    </article>
                  </Link>
                ))}
              </div>
            )}
          </main>

          {/* ── Sidebar ── */}
          <aside className="w-full shrink-0 space-y-6 lg:w-60 xl:w-72">

            {/* Category filter */}
            {categories.length > 0 && (
              <div className="rounded-xl border bg-card p-5">
                <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Categories
                </h3>
                <ul className="space-y-0.5">
                  <li>
                    <button
                      onClick={() => setActiveCategory(null)}
                      className={cn(
                        "w-full rounded-lg px-3 py-2 text-left text-sm transition-colors",
                        activeCategory === null
                          ? "bg-brand-green/10 font-medium text-brand-green"
                          : "text-muted-foreground hover:bg-muted"
                      )}
                    >
                      All Posts
                    </button>
                  </li>
                  {categories.map((cat) => (
                    <li key={cat}>
                      <button
                        onClick={() => setActiveCategory(cat)}
                        className={cn(
                          "w-full rounded-lg px-3 py-2 text-left text-sm transition-colors",
                          activeCategory === cat
                            ? "bg-brand-green/10 font-medium text-brand-green"
                            : "text-muted-foreground hover:bg-muted"
                        )}
                      >
                        {cat}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Recent posts */}
            {recentPosts.length > 0 && (
              <div className="rounded-xl border bg-card p-5">
                <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Recent Posts
                </h3>
                <ul className="space-y-4">
                  {recentPosts.map((post) => (
                    <li key={post.id}>
                      <Link to={`/blog/${post.slug}`} className="group block">
                        <p className="line-clamp-2 text-sm font-medium leading-snug group-hover:text-brand-green">
                          {post.title}
                        </p>
                        {post.published_at && (
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            {format(new Date(post.published_at), "MMM d, yyyy")}
                          </p>
                        )}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* CTA */}
            <div className="rounded-xl border border-brand-green/30 bg-brand-green/5 p-5">
              <p className="text-sm font-semibold text-foreground">Want the full guide?</p>
              <p className="mt-1 text-xs text-muted-foreground">Browse all our micro-guides for in-depth, practical walkthroughs.</p>
              <Link to="/guides">
                <Button variant="outline" size="sm" className="mt-3 border-brand-green/40 text-brand-green hover:bg-brand-green hover:text-white">
                  View Guides →
                </Button>
              </Link>
            </div>
          </aside>
        </div>
      </section>
    </Layout>
  );
}
