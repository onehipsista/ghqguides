import { Link } from "react-router-dom";
import { Instagram, Linkedin, Mail, SquareArrowOutUpRight } from "lucide-react";

const quickLinks = [
  { label: "Design Mistakes", href: "/mistakes", external: false },
  { label: "MicroGuides", href: "/guides", external: false },
  { label: "Design Check", href: "https://app.gethipquick.com", external: true },
];

const resourceLinks = [
  { label: "Resource Shop", href: "/shop" },
  { label: "What's Hip", href: "/blog" },
  { label: "HipTips", href: "#" },
];

const legalLinks = [
  { label: "Privacy Policy", href: "https://gethipquick.com/privacy-policy/" },
  { label: "Terms of Use", href: "https://gethipquick.com/terms/" },
];

const socialLinks = [
  { label: "Facebook", href: "https://facebook.com/gethipquickco", shortLabel: "f" },
  { label: "Instagram", href: "https://instagram.com/gethipquickco", icon: Instagram },
  { label: "LinkedIn", href: "https://www.linkedin.com/company/gethipquickco", icon: Linkedin },
  { label: "Email", href: "mailto:hello@gethipquick.com", icon: Mail },
  { label: "Reddit", href: "https://www.reddit.com/r/GetHipQuick/", shortLabel: "r" },
];

export function Footer() {
  return (
    <footer className="border-t border-white/10 bg-[#040e12]">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-12 md:grid-cols-4">
          {/* Brand */}
          <div>
            <a href="https://gethipquick.com/" target="_blank" rel="noopener noreferrer" className="inline-block">
              <img
                src="/ghq_logo_w.svg"
                alt="GetHipQuick"
                className="block h-6 w-auto"
              />
            </a>
            <p className="mt-4 text-sm leading-relaxed text-nav-foreground/60">
              Check out the growing library of articles, MicroGuides, and checklists. Get Hip. Stay Hip.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-sm font-bold uppercase tracking-widest text-brand-green">
              Quick Links
            </h3>
            <ul className="mt-5 space-y-3">
              {quickLinks.map((link) => (
                <li key={link.href}>
                  {link.external ? (
                    <a
                      href={link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-sm text-nav-foreground/30 transition-colors hover:text-brand-green"
                    >
                      {link.label}
                      <SquareArrowOutUpRight className="h-3.5 w-3.5" />
                    </a>
                  ) : (
                    <Link
                      to={link.href}
                      className="text-sm text-nav-foreground/30 transition-colors hover:text-brand-green"
                    >
                      {link.label}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h3 className="text-sm font-bold uppercase tracking-widest text-brand-green">
              Resources
            </h3>
            <ul className="mt-5 space-y-3">
              {resourceLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    to={link.href}
                    className="text-sm text-nav-foreground/70 transition-colors hover:text-brand-green"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact + Social */}
          <div>
            <h3 className="text-sm font-bold uppercase tracking-widest text-brand-green">
              Connect
            </h3>
            <p className="mt-5 text-sm leading-relaxed text-nav-foreground/70">
              Say hi.{" "}
              <a
                href="mailto:hello@gethipquick.com"
                className="text-brand-green hover:underline"
              >
                hello@gethipquick.com
              </a>
            </p>
            <div className="mt-5 flex items-center gap-2">
              {socialLinks.map((link) => {
                const Icon = link.icon;

                return (
                  <a
                    key={link.label}
                    href={link.href}
                    aria-label={link.label}
                    target={link.href.startsWith("mailto:") ? undefined : "_blank"}
                    rel={link.href.startsWith("mailto:") ? undefined : "nofollow noopener noreferrer"}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/10 text-white transition-colors hover:border-brand-green hover:text-brand-green"
                  >
                    {Icon ? <Icon className="h-3.5 w-3.5" /> : <span className="text-xs font-bold uppercase">{link.shortLabel}</span>}
                  </a>
                );
              })}
            </div>
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-4 border-t border-white/10 pt-8 text-xs sm:flex-row sm:items-center sm:justify-between">
          <p className="text-nav-foreground/30">
            © {new Date().getFullYear()} <a href="mailto:onehipsista@gethipquick.com" className="transition-colors hover:text-brand-green">OneHipSista</a> LLC. GetHipQuick. All rights reserved.
          </p>
          <div className="flex items-center gap-8">
            {legalLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-nav-foreground/40 transition-colors hover:text-brand-green"
              >
                {link.label}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
