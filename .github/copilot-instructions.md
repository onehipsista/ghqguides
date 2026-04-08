# GHQ Microlearning Site — MVP Plan
### *guides.gethipquick.com*

---
When working on complex tasks, proceed with all necessary file changes and terminal commands without pausing for incremental confirmation. I will review the final diff and rollback if needed.

## What You're Building

A mobile-first, searchable microlearning platform on `guides.gethipquick.com` — two sections under one roof:

1. **Common Design Mistakes** — filterable card grid (already prototyped and partially built in WP)
2. **MicroGuides** — short structured guides with a library, TOC, and article navigation

Both sections share Supabase auth and a single Stripe paywall. You manage all content through a simple **admin panel** — no touching Supabase directly, ever.

**Stack:** React + Vite + Tailwind + Supabase + Stripe + Vercel
**Subdomain:** `guides.gethipquick.com`
**Shared Supabase project:** Same instance as Design Check (`otaohyabqvpfwbmomzlx`)

---

## Supabase Schema

### Existing (shared from Design Check)
```
profiles          — user data, guide_access flag lives here
blurbs            — review phrases (read-only reference from this app)
```

### New tables for this app

#### `design_issues`
| Column | Type | Notes |
|---|---|---|
| `id` | uuid | primary key |
| `title` | text | |
| `category` | text | Typography, Color, Spacing, etc. |
| `severity` | text | minor, moderate, major |
| `body` | text | the main explanation |
| `how_to_fix` | text | paywalled content |
| `published` | boolean | draft vs live |
| `order_index` | integer | manual sort order |
| `created_at` | timestamp | auto |

#### `guides`
| Column | Type | Notes |
|---|---|---|
| `id` | uuid | primary key |
| `title` | text | |
| `slug` | text | unique, URL-safe |
| `description` | text | shown on library grid card |
| `cover_image` | text | URL |
| `category` | text | |
| `featured` | boolean | highlights on library page |
| `published` | boolean | |
| `updated_at` | timestamp | shown as "last updated" |

#### `sections`
| Column | Type | Notes |
|---|---|---|
| `id` | uuid | primary key |
| `guide_id` | uuid | FK → guides |
| `title` | text | |
| `order_index` | integer | |

*(Optional — skip for short guides that go straight to articles)*

#### `articles`
| Column | Type | Notes |
|---|---|---|
| `id` | uuid | primary key |
| `guide_id` | uuid | FK → guides |
| `section_id` | uuid | FK → sections, nullable |
| `title` | text | |
| `slug` | text | |
| `content` | text | rich text / markdown |
| `order_index` | integer | drives prev/next navigation |
| `published` | boolean | |
| `updated_at` | timestamp | |

#### `categories`
| Column | Type | Notes |
|---|---|---|
| `id` | uuid | |
| `name` | text | |
| `slug` | text | |

---

## Access & Paywall Logic

| User | Access |
|---|---|
| Logged out | Preview: 8 free Mistakes cards, Guide overviews only |
| Free account | Same as logged out |
| Paid ($4.99 one-time) | Full Mistakes access including How to Fix; full Guide articles |
| Design Check customer | Full access — same `guide_access` flag, set automatically |

**How the flag works:**
- `profiles.guide_access = true` unlocks everything
- Stripe webhook sets this on purchase
- Design Check purchase webhook sets it too — one flag, both products

---

## Pages & Routes

### Public
| Route | Page |
|---|---|
| `/` | Landing — hero, what's inside, severity explainer, preview cards, CTA |
| `/mistakes` | Common Design Mistakes — full card grid with filters |
| `/guides` | Guide library — grid of all published guides |
| `/guides/[slug]` | Guide overview + TOC |
| `/guides/[slug]/[article-slug]` | Article page |
| `/login` | Auth |

### Admin (you only)
| Route | Page |
|---|---|
| `/admin` | Dashboard — counts, quick links |
| `/admin/mistakes` | List all issues — edit, publish/unpublish, reorder |
| `/admin/mistakes/new` | Add new issue |
| `/admin/mistakes/[id]` | Edit issue |
| `/admin/guides` | List all guides |
| `/admin/guides/new` | Add new guide |
| `/admin/guides/[id]` | Edit guide + manage its sections and articles |
| `/admin/articles/new` | Add article to a guide |
| `/admin/articles/[id]` | Edit article |
| `/admin/categories` | Manage categories |
| `/admin/users` | View users, manually grant/revoke access |

---

## Admin Panel Features

This is your WordPress replacement. It needs to feel as easy.

### Mistakes Manager
- Table view of all issues with title, category, severity badge, published status
- Inline publish/unpublish toggle
- Drag-to-reorder (or manual order field)
- Add/edit form: title, category (dropdown), severity (dropdown), body (textarea), how to fix (textarea), published toggle
- Duplicate issue button (useful for similar issues)

### Guides Manager
- Card grid of guides with cover image, title, status
- Featured toggle
- Add/edit guide: title, slug (auto-generated), description, cover image upload, category, published toggle
- Inside a guide: manage sections (add, reorder, delete) and articles (add, reorder, move between sections)

### Article Editor
- Title, content (rich text editor — recommend TipTap or React SimpleMDE)
- Parent guide selector
- Section selector (optional)
- Order index
- Published toggle
- Last updated auto-stamps on save

### Categories Manager
- Simple list — add, rename, delete
- Used by both Mistakes (issue_category) and Guides

### Users
- Table of registered users
- Show email, join date, guide_access status
- Manual toggle to grant/revoke access (for gifting, comps, etc.)

---

## UI Components

### Public Side
- **Nav bar** — Logo, Guide Library, Sign In / Account
- **Mistakes card** — severity badge, category label, title, body (3-line clamp), tap → modal with full body + How to Fix (if unlocked)
- **Filter bar** — category pills + severity pills + search input
- **Paywall overlay** — blurred cards + CTA card
- **Guide library card** — cover image, title, category, description, "Read Guide" button
- **Guide detail** — sidebar TOC (desktop) / collapsible TOC (mobile), breadcrumbs, article content, prev/next navigation
- **Article page** — full content, breadcrumb trail, related guides

### Admin Side
- Clean, functional — doesn't need to be beautiful, just clear
- Sidebar nav between sections
- Forms with clear labels, dropdowns for controlled fields
- Status badges matching public severity colors
- Confirm dialogs before destructive actions (delete, unpublish)

---

## Build Phases

### Phase 1 — Mistakes (ship this first)
- [ ] New React/Vite project, Tailwind configured from day one
- [ ] Supabase client set up, `design_issues` table created
- [ ] Seed table from existing WP content (export → CSV → Supabase import)
- [ ] Public card grid with category + severity filters + search
- [ ] Card modal — full body, locked How to Fix section
- [ ] Paywall: first 8 free, rest blurred, CTA overlay
- [ ] Stripe $4.99 one-time payment → sets `guide_access` on profile
- [ ] Auth (login/signup) — shared Supabase project
- [ ] Admin: Mistakes manager (list, add, edit, publish toggle)
- [ ] Deploy to `guides.gethipquick.com` on Vercel

### Phase 2 — Guides
- [ ] `guides`, `sections`, `articles`, `categories` tables created
- [ ] Admin: Guides manager + Article editor with rich text
- [ ] Public Guide library grid
- [ ] Guide detail page with TOC sidebar
- [ ] Article page with breadcrumbs + prev/next
- [ ] Paywall gates article content for non-paying users

### Phase 3 — Polish
- [ ] Global search across both Mistakes and Guides
- [ ] Related guides suggestions on article pages
- [ ] Featured guides on library page
- [ ] Admin: Users manager (view, manual access toggle)
- [ ] Categories manager
- [ ] PDF guide sales via Stripe payment links (replaces WooCommerce)
- [ ] Email capture for free/logged-out users (MailerLite)

---

## Content Migration (WP → Supabase)

Your ACF/CPT data in WordPress exports cleanly to CSV.

1. **Export:** In WP admin, use the built-in exporter or "WP All Export" plugin → export `design-issue` CPT with all ACF fields
2. **Clean:** Open in Excel/Google Sheets, map columns to Supabase schema, remove any WP-specific IDs
3. **Import:** Supabase table editor accepts CSV import directly — paste or upload
4. **Done:** No data entry, no retyping

---

## Tech Decisions

| Decision | Choice | Why |
|---|---|---|
| Framework | React + Vite | Same as Design Check — consistent, you know it |
| Styling | Tailwind (v4) | Non-negotiable per your own rules — no inline style debt |
| Database | Supabase | Already running, shared auth with Design Check |
| Rich text editor | TipTap | Clean React integration, outputs HTML, customizable |
| Payments | Stripe | Same integration as Design Check |
| Hosting | Vercel | Same as Design Check |
| Admin auth | Supabase `profiles.role = 'admin'` | Simple role check, no extra auth system |

---

## Lovable Prompt Sequence

One feature per prompt. Do not combine.

**Phase 1 — Mistakes:**

1. *"Create a React/Vite app with Tailwind. Connect to Supabase project [ref]. The app will live at guides.gethipquick.com."*
2. *"Create a Supabase table called `design_issues` with these columns: [paste schema]. Seed it with these records: [paste first 10]."*
3. *"Build a public page at `/mistakes` that fetches from `design_issues` and displays a filterable card grid. Cards show: severity badge, category label, title, body (3-line clamp). Filter pills for category and severity. Search input filters title and body."*
4. *"Add a modal that opens when a card is tapped. Show full body text. If `profiles.guide_access` is true, also show the `how_to_fix` field. If not, show a locked placeholder with an upgrade CTA."*
5. *"Add a paywall to the mistakes page: show first 8 cards normally, blur cards 9 onward, overlay a paywall card with a $4.99 Stripe payment button. Check `profiles.guide_access` — if true, show all cards unlocked."*
6. *"Build the admin route `/admin/mistakes`. Protect it with a role check: `profiles.role = 'admin'`. Show a table of all design_issues with title, category, severity, published status. Add publish/unpublish toggle per row."*
7. *"Add `/admin/mistakes/new` and `/admin/mistakes/[id]` — a form with fields for title, category (select), severity (select), body (textarea), how_to_fix (textarea), and published toggle. Save to Supabase."*

**Phase 2 — Guides (after Phase 1 is live):**

8. *"Create Supabase tables: `guides`, `sections`, `articles`, `categories` with these schemas: [paste]. Build `/guides` — a library grid showing published guides with cover image, title, description, category."*
9. *"Build `/guides/[slug]` — guide overview page with a sidebar TOC listing sections and articles. On mobile the TOC collapses into an accordion."*
10. *"Build `/guides/[slug]/[article-slug]` — article page with breadcrumbs (Library → Guide → Section → Article), full article content, and prev/next navigation based on order_index."*
11. *"Build the admin guide manager at `/admin/guides` — list of guides with add/edit. Inside a guide edit page, show its sections and articles with ability to add, reorder, and delete."*
12. *"Add a rich text article editor using TipTap at `/admin/articles/new` and `/admin/articles/[id]`."*

---

## A Note on the Admin Panel

Think of it like your music releases admin — the same mental model applies:

- Guides = Albums
- Sections = Playlists
- Articles = Tracks
- Categories = Genres
- Featured toggle = same thing

You built that. You can build this.

---

*GHQ / OneHipSista LLC — Internal planning document*
