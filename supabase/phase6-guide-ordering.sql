-- Phase 6: manual guide ordering
-- Safe to run multiple times

alter table ghq_guides.guides
  add column if not exists order_index integer;

with ranked as (
  select id, row_number() over (order by featured desc, updated_at desc, created_at desc, title asc) as next_order
  from ghq_guides.guides
)
update ghq_guides.guides g
set order_index = ranked.next_order
from ranked
where g.id = ranked.id
  and (g.order_index is null or g.order_index = 0);

alter table ghq_guides.guides
  alter column order_index set default 0;

create index if not exists guides_order_idx
  on ghq_guides.guides (order_index);