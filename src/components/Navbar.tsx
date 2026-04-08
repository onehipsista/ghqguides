import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "react-router-dom";
import { Menu, Search, Shield, SquareArrowOutUpRight, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getAccessState } from "@/lib/access";
import { adminEmailAllowlist } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/use-auth";

const baseNavLinks = [
  { label: "Design Mistakes", href: "/mistakes" },
  { label: "MicroGuides", href: "/guides" },
  { label: "Resource Shop", href: "/shop" },
  { label: "What's Hip", href: "/blog" },
];

const externalNavLinks = [
  { label: "Design Check", href: "https://app.gethipquick.com" },
];

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const { isAuthenticated } = useAuth();
  const { data: accessState } = useQuery({
    queryKey: ["access-state"],
    queryFn: getAccessState,
    enabled: isAuthenticated,
  });

  const isAdminByRole = accessState?.role === "admin";
  const isAdminByAllowlist = Boolean(
    accessState?.email && adminEmailAllowlist.includes(accessState.email.toLowerCase())
  );
  const isAdmin = isAdminByRole || isAdminByAllowlist;
  const loginHref = `/login?redirect=${encodeURIComponent(`${location.pathname}${location.search}${location.hash}`)}`;

  const navLinks = baseNavLinks;

  const handleSignOut = async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
  };

  return (
    <nav className="bg-nav sticky top-0 z-50 border-b border-white/10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center">
            <img src="/ghq_logo_gw.svg" alt="GetHipQuick" className="h-9 w-auto" />
          </Link>

          {/* Desktop nav */}
          <div className="hidden items-center gap-1 lg:flex">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className={cn(
                  "rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  location.pathname === link.href
                    ? "text-brand-green"
                    : "text-nav-foreground/70 hover:text-nav-foreground"
                )}
              >
                {link.label}
              </Link>
            ))}
            {externalNavLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 rounded-md px-3 py-2 text-sm font-medium text-nav-foreground/70 transition-colors hover:text-nav-foreground"
              >
                {link.label}
                <SquareArrowOutUpRight className="h-3.5 w-3.5" />
              </a>
            ))}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-2">
            <Link
              to="/search"
              className="hidden lg:inline-flex"
              aria-label="Search"
              title="Search"
            >
              <Button
                variant="ghost"
                size="icon"
                className="text-nav-foreground/70 hover:bg-white/5 hover:text-nav-foreground"
              >
                <Search className="h-4 w-4" />
              </Button>
            </Link>

            {isAdmin && (
              <Link to="/admin" className="hidden lg:inline-flex">
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-1.5 text-nav-foreground/75 hover:bg-white/5 hover:text-nav-foreground"
                >
                  <Shield className="h-4 w-4" />
                  Admin
                </Button>
              </Link>
            )}

            {isAuthenticated ? (
              <Button
                variant="outline"
                size="sm"
                className="hidden border-brand-green/30 bg-transparent text-brand-green hover:bg-brand-green hover:text-primary-foreground lg:inline-flex"
                onClick={handleSignOut}
              >
                Sign Out
              </Button>
            ) : (
              <Link to={loginHref} className="hidden lg:inline-flex">
                <Button
                  variant="outline"
                  size="sm"
                  className="border-brand-green/30 bg-transparent text-brand-green hover:bg-brand-green hover:text-primary-foreground"
                >
                  Sign In
                </Button>
              </Link>
            )}

            {/* Mobile menu button */}
            <Button
              variant="ghost"
              size="icon"
              className="text-nav-foreground lg:hidden"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="border-t border-white/10 lg:hidden">
          <div className="space-y-1 px-4 py-3">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "block rounded-md px-3 py-2 text-base font-medium transition-colors",
                  location.pathname === link.href
                    ? "text-brand-green bg-white/5"
                    : "text-nav-foreground/70 hover:text-nav-foreground hover:bg-white/5"
                )}
              >
                {link.label}
              </Link>
            ))}

            {externalNavLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-2 rounded-md px-3 py-2 text-base font-medium text-nav-foreground/70 transition-colors hover:bg-white/5 hover:text-nav-foreground"
              >
                {link.label}
                <SquareArrowOutUpRight className="h-4 w-4" />
              </a>
            ))}

            {isAdmin && (
              <Link
                to="/admin"
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-2 rounded-md px-3 py-2 text-base font-medium text-nav-foreground/70 transition-colors hover:bg-white/5 hover:text-nav-foreground"
              >
                <Shield className="h-4 w-4" />
                Admin
              </Link>
            )}

            <Link
              to="/search"
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-2 rounded-md px-3 py-2 text-base font-medium text-nav-foreground/70 transition-colors hover:bg-white/5 hover:text-nav-foreground"
            >
              <Search className="h-4 w-4" />
              Search
            </Link>

            {isAuthenticated ? (
              <button
                type="button"
                onClick={async () => {
                  await handleSignOut();
                  setMobileOpen(false);
                }}
                className="block w-full rounded-md px-3 py-2 text-left text-base font-medium text-nav-foreground/70 transition-colors hover:bg-white/5 hover:text-nav-foreground"
              >
                Sign Out
              </button>
            ) : (
              <Link
                to={loginHref}
                onClick={() => setMobileOpen(false)}
                className="block rounded-md px-3 py-2 text-base font-medium text-nav-foreground/70 transition-colors hover:bg-white/5 hover:text-nav-foreground"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
