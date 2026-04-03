import { Link } from "react-router-dom";

export function Footer() {
  return (
    <footer className="border-t border-white/10 bg-[#040e12]">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-8 md:grid-cols-3">
          {/* Brand */}
          <div>
            <img
              src="/ghq_logo_w.svg"
              alt="GetHipQuick"
              className="h-6 w-auto"
            />
            <p className="mt-2 text-sm text-nav-foreground/60">
              Micro-learning guides for designers who want to level up fast.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-nav-foreground/40">
              Quick Links
            </h3>
            <ul className="mt-3 space-y-2">
              {[
                { label: "Common Design Issues", href: "/mistakes" },
                { label: "Guide Library", href: "/guides" },
                { label: "Get Access", href: "/access" },
              ].map((link) => (
                <li key={link.href}>
                  <Link
                    to={link.href}
                    className="text-sm text-nav-foreground/60 transition-colors hover:text-brand-green"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-nav-foreground/40">
              Contact
            </h3>
            <p className="mt-3 text-sm text-nav-foreground/60">
              Questions? Reach out at{" "}
              <a
                href="mailto:hello@gethipquick.com"
                className="text-brand-green hover:underline"
              >
                hello@gethipquick.com
              </a>
            </p>
          </div>
        </div>

        <div className="mt-8 border-t border-white/10 pt-6">
          <p className="text-center text-xs text-nav-foreground/40">
            © {new Date().getFullYear()} OneHipSista LLC. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
