import { Link, Navigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Layout } from "@/components/Layout";
import { getAccessState } from "@/lib/access";
import { adminEmailAllowlist } from "@/lib/supabase";

const cards = [
  {
    title: "Design Issues",
    description: "Manage mistakes, publishing, and order.",
    href: "/admin/mistakes",
  },
  {
    title: "Guides",
    description: "Create and edit guide metadata.",
    href: "/admin/guides",
  },
  {
    title: "Categories",
    description: "Add, rename, and delete categories.",
    href: "/admin/categories",
  },
  {
    title: "New Article",
    description: "Quickly add an article to a guide.",
    href: "/admin/articles/new",
  },
  {
    title: "Users",
    description: "Grant or revoke guide access. Assign admin roles.",
    href: "/admin/users",
  },
];

export default function AdminDashboardPage() {
  const { data: accessState, isLoading } = useQuery({
    queryKey: ["access-state"],
    queryFn: getAccessState,
  });

  const isAdminByRole = accessState?.role === "admin";
  const isAdminByAllowlist = Boolean(
    accessState?.email && adminEmailAllowlist.includes(accessState.email.toLowerCase())
  );
  const isAdmin = isAdminByRole || isAdminByAllowlist;

  if (!isLoading && !isAdmin) {
    return <Navigate to="/login" replace />;
  }

  return (
    <Layout>
      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <h1 className="font-display text-2xl font-bold text-foreground">Admin Dashboard</h1>
        <p className="mt-2 text-sm text-muted-foreground">Choose an area to manage content.</p>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map((card) => (
            <Link
              key={card.href}
              to={card.href}
              className="rounded-xl border bg-card p-5 transition-colors hover:border-brand-green/60"
            >
              <h2 className="font-display text-lg font-semibold text-foreground">{card.title}</h2>
              <p className="mt-2 text-sm text-muted-foreground">{card.description}</p>
            </Link>
          ))}
        </div>
      </section>
    </Layout>
  );
}
