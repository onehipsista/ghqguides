import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";

const adminLinks = [
  { label: "Dashboard", href: "/admin" },
  { label: "Issues", href: "/admin/mistakes" },
  { label: "Guides", href: "/admin/guides" },
  { label: "Blog", href: "/admin/blog" },
  { label: "Products", href: "/admin/products" },
  { label: "Users", href: "/admin/users" },
];

export function AdminNav() {
  const location = useLocation();

  const isActive = (href: string) => {
    if (href === "/admin") {
      return location.pathname === "/admin";
    }
    return location.pathname.startsWith(href);
  };

  return (
    <div className="sticky top-16 z-40 border-b bg-muted/40 backdrop-blur">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <nav className="flex items-center gap-1 overflow-x-auto py-1">
          {adminLinks.map((link) => (
            <Link
              key={link.href}
              to={link.href}
              className={cn(
                "shrink-0 rounded-[2px] px-3 py-1.5 text-xs font-semibold uppercase tracking-wide transition-colors",
                isActive(link.href)
                  ? "bg-brand-green text-white"
                  : "text-muted-foreground hover:bg-brand-green/10 hover:text-brand-green"
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </div>
  );
}
