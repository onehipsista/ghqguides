-- Phase 10: MicroGuides overview banner image
-- Safe to run multiple times

alter table ghq_guides.guides
  add column if not exists overview_banner_image text;

comment on column ghq_guides.guides.overview_banner_image is 'Optional short hero/banner image for MicroGuide overview page.';
