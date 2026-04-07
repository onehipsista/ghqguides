# GHQ Guides MVP

This app runs on React + Vite + Tailwind and now supports live data from Supabase for the Mistakes page.

## 1) Environment setup

1. Copy [.env.example](.env.example) to `.env.local`
2. Fill in `VITE_SUPABASE_URL`.
3. Fill in `VITE_SUPABASE_ANON_KEY`.
4. Set `VITE_STRIPE_CHECKOUT_MODE` to `hosted` or `embedded`.
5. Fill in `VITE_STRIPE_PAYMENT_LINK` (used in hosted mode and fallback).
6. If using embedded mode, fill in `VITE_STRIPE_PUBLISHABLE_KEY`.
7. (Optional) Set `VITE_GUIDE_ACCESS_PRICE_LABEL` (default: `$5.99`).
8. (Optional) Set `VITE_DEV_PORT` if you want a fixed local port.

## 1b) Vercel environment variables

For production deployments, `.env.local` is not uploaded to Vercel.

Add these in Vercel → Project Settings → Environment Variables:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_STRIPE_CHECKOUT_MODE`
- `VITE_STRIPE_PAYMENT_LINK`
- `VITE_STRIPE_PUBLISHABLE_KEY` (required for embedded mode)
- `VITE_ADMIN_EMAILS` (optional)
- `VITE_GUIDE_ACCESS_PRICE_LABEL` (optional)

After saving them, redeploy the project.

## 2) Supabase kickoff SQL

Run [supabase/phase1-ghq-guides.sql](supabase/phase1-ghq-guides.sql) in the Supabase SQL editor.

For Phase 2 (Guide Library), run [supabase/phase2-guides.sql](supabase/phase2-guides.sql).

For billing automation, run [supabase/phase3-billing-webhook.sql](supabase/phase3-billing-webhook.sql).

For guide metadata enhancements (audience/level/synopsis/reading-time), run [supabase/phase4-guides-metadata.sql](supabase/phase4-guides-metadata.sql).

For cover image uploads, run [supabase/phase5-media-bucket.sql](supabase/phase5-media-bucket.sql).

For manual guide ordering in admin drag-and-drop, run [supabase/phase6-guide-ordering.sql](supabase/phase6-guide-ordering.sql).

This creates:

- schema: `ghq_guides`
- table: `ghq_guides.design_issues`
- baseline RLS policies
- optional read-only `ghq_guides.blurbs_readonly` view

## 3) Local development

```bash
npm install
npm run dev
```

Vite now reads your dev port in this order: `VITE_DEV_PORT` → `PORT` → `5173`.
If the selected port is busy, it will automatically pick the next available one.

App routes now include:

- `/mistakes` (live data with safe fallback)
- `/guides` (published guide library)
- `/guides/:slug` (guide overview + TOC)
- `/guides/:slug/:article-slug` (article page + prev/next)
- `/login` (Supabase email sign in/up)
- `/admin` (dashboard)
- `/admin/mistakes` (publish, reorder, duplicate, edit)
- `/admin/guides`, `/admin/guides/new`, `/admin/guides/:id`
- `/admin/articles/new`, `/admin/articles/:id`
- `/admin/categories` (add, rename, delete)
- `/billing/success` and `/billing/cancel`
- `/billing/checkout` (embedded checkout mode)

## Notes

- If `ghq_guides.design_issues` is empty or unavailable, the app falls back to `public.blurbs`, then local mock data.
- Mistakes unlock checks `profiles.guide_access`.
- Billing supports `hosted` (Payment Link) and `embedded` Stripe Checkout modes.
- Keep your existing Design Check webhook as source of truth to set `profiles.guide_access = true` after payment.

## Stripe webhook (auto-unlock guide access)

1. Deploy edge function:
   - `supabase functions deploy create-checkout-session` (embedded checkout)
   - `supabase functions deploy stripe-webhook`
2. Set function secrets:
   - `supabase secrets set STRIPE_SECRET_KEY=...`
   - `supabase secrets set STRIPE_WEBHOOK_SIGNING_SECRET=...`
   - `supabase secrets set STRIPE_GUIDE_ACCESS_PRICE_ID=price_...` (embedded checkout)
   - `supabase secrets set SITE_URL=https://guides.gethipquick.com` (embedded checkout return URLs)
3. In Stripe Dashboard → Developers → Webhooks:
   - Endpoint URL: `https://<your-project-ref>.supabase.co/functions/v1/stripe-webhook`
   - Events: `checkout.session.completed` and `checkout.session.async_payment_succeeded`
4. Stripe will now grant access automatically by buyer email using `public.grant_guide_access_by_email(...)`.
