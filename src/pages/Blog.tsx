import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Calendar, Clock } from "lucide-react";
import { format, isValid } from "date-fns";
import { Layout } from "@/components/Layout";
import { getPostTopLevelCategories, getPrimaryPostCategory, getPublicPosts } from "@/lib/posts";
import { cn } from "@/lib/utils";

const safeFormatDate = (value: string | null | undefined, pattern: string) => {
  if (!value) return null;
  const date = new Date(value);
  return isValid(date) ? format(date, pattern) : null;
};

export default function BlogPage() {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const { data: posts = [], isLoading } = useQuery({
    queryKey: ["public-posts"],
    queryFn: () => getPublicPosts(),
  });

  const categories = Array.from(
    new Set(posts.flatMap((post) => getPostTopLevelCategories(post.category)))
  ).sort((a, b) => a.localeCompare(b));

  const visiblePosts = activeCategory
    ? posts.filter((post) => getPostTopLevelCategories(post.category).includes(activeCategory))
    : posts;

  const recentPosts = posts.slice(0, 5);

  return (
    <Layout>
      {/* Hero */}
      <section className="bg-nav">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-brand-green">What's Hip</p>
          <h1 className="font-display text-3xl font-bold text-white sm:text-4xl">
            <span className="text-brand-green-light">What's</span> Hip
          </h1>
          <p className="mt-3 max-w-xl text-base text-nav-foreground/70">
            Short, actionable reads for non-designers, small business owners, and anyone who makes things look good.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        {categories.length > 0 && (
          <div className="mb-6 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setActiveCategory(null)}
              className={cn(
                "rounded-md border px-3 py-1.5 text-sm transition-colors",
                activeCategory === null
                  ? "border-brand-green bg-brand-green text-white"
                  : "border-border bg-card text-foreground/80 hover:border-brand-green/60"
              )}
            >
              All Categories
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setActiveCategory(cat)}
                className={cn(
                  "rounded-md border px-3 py-1.5 text-sm transition-colors",
                  activeCategory === cat
                    ? "border-brand-green bg-brand-green text-white"
                    : "border-border bg-card text-foreground/80 hover:border-brand-green/60"
                )}
              >
                {cat}
              </button>
            ))}
          </div>
        )}

        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_280px]">
          <main>
            {isLoading ? (
              <div className="py-16 text-center text-muted-foreground">Loading posts...</div>
            ) : visiblePosts.length === 0 ? (
              <div className="rounded-xl border bg-card p-8 text-center text-muted-foreground">
                No posts published yet. Check back soon.
              </div>
            ) : (
              <div className="grid gap-5 md:grid-cols-2">
                {visiblePosts.map((post) => (
                  <Link key={post.id} to={`/blog/${post.slug}`} className="group block">
                    <article className="h-full overflow-hidden rounded-xl border bg-card transition-colors hover:border-brand-green/50">
                      {post.cover_image && (
                        <img
                          src={post.cover_image}
                          alt={post.title}
                          className="aspect-[16/9] w-full object-cover"
                        />
                      )}
                      <div className="p-4 sm:p-5">
                        {getPrimaryPostCategory(post.category) && (
                          <span className="mb-2 inline-block text-[11px] font-bold uppercase tracking-[0.16em] text-brand-green">
                            {getPrimaryPostCategory(post.category)}
                          </span>
                        )}
                        <h2 className="font-display text-xl font-bold leading-snug text-foreground group-hover:text-brand-green">
                          {post.title}
                        </h2>
                        {post.excerpt && (
                          <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">{post.excerpt}</p>
                        )}
                        <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                          {safeFormatDate(post.published_at, "MMM d, yyyy") && (
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {safeFormatDate(post.published_at, "MMM d, yyyy")}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {post.reading_time_minutes} min read
                          </span>
                        </div>
                      </div>
                    </article>
                  </Link>
                ))}
              </div>
            )}
          </main>

          <aside className="space-y-4">
            <div className="rounded-xl border bg-card p-4">
              <h2 className="font-display text-base font-bold text-foreground">Top Categories</h2>
              <ul className="mt-3 space-y-2">
                <li>
                  <button
                    type="button"
                    onClick={() => setActiveCategory(null)}
                    className={cn(
                      "w-full rounded-md px-2 py-1.5 text-left text-sm transition-colors",
                      activeCategory === null
                        ? "bg-brand-green/10 font-medium text-brand-green"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    All Categories
                  </button>
                </li>
                {categories.map((cat) => (
                  <li key={cat}>
                    <button
                      type="button"
                      onClick={() => setActiveCategory(cat)}
                      className={cn(
                        "w-full rounded-md px-2 py-1.5 text-left text-sm transition-colors",
                        activeCategory === cat
                          ? "bg-brand-green/10 font-medium text-brand-green"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground"
                      )}
                    >
                      {cat}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-xl border bg-card p-4">
              <h2 className="font-display text-base font-bold text-foreground">Recent Posts</h2>
              <ul className="mt-3 space-y-3">
                {recentPosts.map((post) => (
                  <li key={post.id}>
                    <Link to={`/blog/${post.slug}`} className="group block">
                      <p className="line-clamp-2 text-sm font-semibold leading-snug text-foreground group-hover:text-brand-green">
                        {post.title}
                      </p>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </aside>
        </div>
      </section>
    </Layout>
  );
}
