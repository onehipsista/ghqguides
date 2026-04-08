-- Phase 9: product media enhancements (separate shop thumbnails, gallery images, and sample PDF links)
-- Safe to run multiple times

alter table ghq_guides.products
  add column if not exists shop_thumbnail_url text;

alter table ghq_guides.products
  add column if not exists gallery_image_urls text[] not null default '{}';

alter table ghq_guides.products
  add column if not exists sample_pdf_url text;

comment on column ghq_guides.products.shop_thumbnail_url is 'Optional 4:3 image used on shop listing cards.';
comment on column ghq_guides.products.gallery_image_urls is 'Optional additional public product image URLs for thumbnail gallery.';
comment on column ghq_guides.products.sample_pdf_url is 'Optional public sample PDF URL shown on product detail page.';
