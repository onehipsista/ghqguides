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
    <div className="sticky top-16 z-40 border-b border-brand-green-light/40 bg-brand-green shadow-sm">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <nav className="flex items-center gap-2 overflow-x-auto py-3">
          {adminLinks.map((link) => (
            <Link
              key={link.href}
              to={link.href}
              className={cn(
                "shrink-0 rounded-md px-4 py-2 text-sm font-medium transition-colors",
                isActive(link.href)
                  ? "bg-white text-brand-green"
                  : "text-white/95 hover:bg-white/15 hover:text-white"
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
