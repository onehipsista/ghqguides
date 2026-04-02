import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "react-router-dom";
import { Menu, X, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getAccessState } from "@/lib/access";
import { adminEmailAllowlist } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/use-auth";

const baseNavLinks = [
  { label: "Common Design Issues", href: "/mistakes" },
  { label: "Guide Library", href: "/guides" },
  { label: "Search", href: "/search" },
  { label: "Account", href: "/login" },
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

  const navLinks = isAdmin
    ? [...baseNavLinks, { label: "Admin", href: "/admin" }]
    : baseNavLinks;

  const handleSignOut = async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
  };

  return (
    <nav className="bg-nav sticky top-0 z-50 border-b border-white/10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <span className="font-display text-lg font-bold text-brand-green">
              GetHipQuick™
            </span>
            <span className="hidden text-sm text-nav-foreground/60 sm:inline">
              |
            </span>
            <span className="hidden text-sm font-medium text-nav-foreground/80 sm:inline">
              Guide Library
            </span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden items-center gap-1 md:flex">
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
          </div>

          {/* Right side */}
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="text-nav-foreground/60 hover:text-brand-green hover:bg-white/5"
            >
              <Heart className="h-5 w-5" />
            </Button>

            {isAuthenticated ? (
              <Button
                variant="outline"
                size="sm"
                className="border-brand-green/30 bg-transparent text-brand-green hover:bg-brand-green hover:text-primary-foreground"
                onClick={handleSignOut}
              >
                Sign Out
              </Button>
            ) : (
              <Link to="/login">
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
              className="text-nav-foreground md:hidden"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="border-t border-white/10 md:hidden">
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
          </div>
        </div>
      )}
    </nav>
  );
}
