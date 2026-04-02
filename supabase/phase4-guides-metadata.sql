-- Phase 4: Guides metadata enhancements
-- Safe to run multiple times

alter table ghq_guides.guides
  add column if not exists audience_market text;

alter table ghq_guides.guides
  add column if not exists level text;

alter table ghq_guides.guides
  add column if not exists material_symbol text;

alter table ghq_guides.articles
  add column if not exists synopsis text;

alter table ghq_guides.articles
  add column if not exists reading_time_minutes integer;

-- Optional starter value normalization
update ghq_guides.guides
set category = 'Graphic Design'
where category is null or btrim(category) = '';

update ghq_guides.guides
set audience_market = 'Small Businesses'
where audience_market is null or btrim(audience_market) = '';

update ghq_guides.guides
set level = 'All Levels'
where level is null or btrim(level) = '';

update ghq_guides.guides
set material_symbol = 'menu_book'
where material_symbol is null or btrim(material_symbol) = '';

update ghq_guides.articles
set reading_time_minutes = greatest(1, ceil(greatest(1, array_length(regexp_split_to_array(coalesce(content, ''), E'\\s+'), 1)) / 200.0)::int)
where reading_time_minutes is null;
