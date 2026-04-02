

# GHQ Microlearning Site — Full Build Plan

## Overview
A mobile-first microlearning platform at `guides.gethipquick.com` with two content sections (Common Design Mistakes + Micro Guides), a shared paywall, and an admin panel — all powered by Supabase.

---

## Phase 1 — Common Design Mistakes (Ship First)

### 1. Connect Supabase & Set Up Database
- Connect to existing Supabase project (`otaohyabqvpfwbmomzlx`)
- Create tables: `design_issues`, `categories`, `user_roles` (with `app_role` enum)
- Create `has_role()` security definer function for safe admin checks
- Set up RLS policies on all tables

### 2. Brand & Layout Shell
- **Dark nav bar** matching existing GetHipQuick brand — logo ("GetHipQuick™ | Guide Library"), nav links (Common Design Issues, Guide Library, Get Access, Sign In), favorites heart icon
- **Light content area** (~#f4f5f7 background)
- **Footer** with logo, quick links, contact
- Mobile-responsive hamburger menu

### 3. Auth (Login/Signup)
- `/login` page with email/password auth via shared Supabase
- Session-aware nav (Sign In → Account/Logout when logged in)
- Password reset flow with `/reset-password` page

### 4. Mistakes Public Page (`/mistakes`)
- **Hero section**: dark bg, "MICRO GUIDES" label, "Common Design Issues" heading, subtitle, severity legend (green/yellow/red dots)
- **Search bar** filtering by title and body
- **Filter pills**: category row (All Categories, Typography, Color, Spacing, etc.) + severity row (All, Minor, Moderate, Major)
- **Card grid** (3 columns desktop, 1 mobile): severity badge, category label, title, body (3-line clamp), favorite heart toggle
- **Card modal**: tap card → modal with full body text + locked "How to Fix" section (shows blurred placeholder + upgrade CTA for non-paying users, full content for users with `guide_access`)
- **Paywall**: first 8 cards visible, remaining cards blurred with overlay CTA card (Stripe button placeholder for now)

### 5. Admin: Mistakes Manager
- Protected routes under `/admin` — only users with `admin` role in `user_roles`
- **Admin sidebar nav** between sections
- `/admin/mistakes` — table view with title, category, severity badge, published toggle
- `/admin/mistakes/new` and `/admin/mistakes/[id]` — form: title, category (dropdown), severity (dropdown), body (textarea), how_to_fix (textarea), published toggle, duplicate button
- Manual reorder via order_index field

### 6. Landing Page (`/`)
- Hero section with value prop
- "What's Inside" preview section
- Severity system explainer
- Preview of a few mistake cards
- CTA to sign up / get access

---

## Phase 2 — Micro Guides

### 7. Guides Database
- Create tables: `guides`, `sections`, `articles`
- RLS policies for public read (published only) + admin write

### 8. Guide Library Page (`/guides`)
- Grid of published guides — cover image, title, category tag, description, date, "READ →" link
- Category filter pills + sort dropdown (Newest First, etc.)
- Featured guides highlighted

### 9. Guide Detail Page (`/guides/[slug]`)
- Guide overview with cover image
- **Desktop**: sidebar TOC listing sections → articles
- **Mobile**: collapsible accordion TOC
- Breadcrumbs: Library → Guide

### 10. Article Page (`/guides/[slug]/[article-slug]`)
- Full article content (markdown/HTML rendered)
- Breadcrumbs: Library → Guide → Section → Article
- Prev/Next navigation based on order_index
- Paywall gate: non-paying users see blurred content + CTA

### 11. Admin: Guides & Articles Manager
- `/admin/guides` — list/grid of guides, add/edit, featured toggle
- Guide edit page: manage sections (add, reorder, delete) and articles within
- `/admin/articles/new` and `/admin/articles/[id]` — rich text editor (TipTap), parent guide selector, section selector, order index, published toggle

---

## Phase 3 — Polish

### 12. Global Search
- Search across both Mistakes and Guides from the nav bar

### 13. Admin: Categories Manager (`/admin/categories`)
- Simple CRUD list, used by both Mistakes and Guides

### 14. Admin: Users Manager (`/admin/users`)
- Table of registered users (email, join date, guide_access status)
- Manual toggle to grant/revoke access

### 15. Related Guides
- Suggestions on article pages based on category

---

## Key Design Decisions
- **Dark nav** with green "GetHipQuick" branding, light content areas
- **Severity colors**: 🟢 Minor, 🟡 Moderate, 🔴 Major
- **Mobile-first** responsive design throughout
- **Stripe deferred** — paywall UI built with placeholder buttons, wired up later
- **user_roles table** with `has_role()` function for secure admin checks (not profiles.role)
- **Shared Supabase** with Design Check — `guide_access` flag on profiles unlocks content

