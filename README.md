# GHQ Guides MVP

This app runs on React + Vite + Tailwind and now supports live data from Supabase for the Mistakes page.

## 1) Environment setup

1. Copy [.env.example](.env.example) to `.env.local`
2. Fill in `VITE_SUPABASE_URL`.
3. Fill in `VITE_SUPABASE_ANON_KEY`.
4. Fill in `VITE_STRIPE_PAYMENT_LINK`.
5. (Optional) Set `VITE_GUIDE_ACCESS_PRICE_LABEL` (default: `$5.99`).
6. (Optional) Set `VITE_DEV_PORT` if you want a fixed local port.

## 2) Supabase kickoff SQL

Run [supabase/phase1-ghq-guides.sql](supabase/phase1-ghq-guides.sql) in the Supabase SQL editor.

For Phase 2 (Guide Library), run [supabase/phase2-guides.sql](supabase/phase2-guides.sql).

For billing automation, run [supabase/phase3-billing-webhook.sql](supabase/phase3-billing-webhook.sql).

For guide metadata enhancements (audience/level/synopsis/reading-time), run [supabase/phase4-guides-metadata.sql](supabase/phase4-guides-metadata.sql).

For cover image uploads, run [supabase/phase5-media-bucket.sql](supabase/phase5-media-bucket.sql).

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

## Notes

- If `ghq_guides.design_issues` is empty or unavailable, the app falls back to `public.blurbs`, then local mock data.
- Mistakes unlock checks `profiles.guide_access`.
- Billing button uses Stripe Payment Link for launch speed.
- Keep your existing Design Check webhook as source of truth to set `profiles.guide_access = true` after payment.

## Stripe webhook (auto-unlock guide access)

1. Deploy edge function:
   - `supabase functions deploy stripe-webhook`
2. Set function secrets:
   - `supabase secrets set STRIPE_SECRET_KEY=...`
   - `supabase secrets set STRIPE_WEBHOOK_SIGNING_SECRET=...`
3. In Stripe Dashboard → Developers → Webhooks:
   - Endpoint URL: `https://<your-project-ref>.supabase.co/functions/v1/stripe-webhook`
   - Events: `checkout.session.completed` and `checkout.session.async_payment_succeeded`
4. Stripe will now grant access automatically by buyer email using `public.grant_guide_access_by_email(...)`.
