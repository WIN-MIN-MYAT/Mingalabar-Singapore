-- ============================================================
-- Dynamic shop categories
-- Run ONCE in the Supabase SQL Editor. Additive to community_schema.sql.
-- After this, add/edit categories by inserting rows in shop_categories —
-- the app builds its filter chips + icons from this table.
-- ============================================================


-- 1. Categories table ----------------------------------------
create table if not exists public.shop_categories (
  id          text primary key,           -- 'food', 'retail', ... (matches shops.type)
  label       text not null,              -- 'Food & Dining'
  icon        text not null,              -- Ionicons name, e.g. 'restaurant'
  sort_order  integer not null default 0, -- controls chip order
  created_at  timestamptz not null default now()
);


-- 2. Seed the current 5 categories ---------------------------
-- Add a new category here (or via the dashboard) and it shows up in-app.
insert into public.shop_categories (id, label, icon, sort_order) values
  ('food',      'Food & Dining',            'restaurant', 1),
  ('retail',    'Retail & Groceries',       'storefront', 2),
  ('health',    'Healthcare & Wellness',    'medkit',     3),
  ('services',  'Professional Services',    'briefcase', 4),
  ('community', 'Community & Culture',       'people',     5)
on conflict (id) do nothing;


-- 3. Switch shops.type from a hardcoded CHECK to a foreign key.
--    Now shops.type must reference a row in shop_categories, so new
--    categories become usable automatically without code changes.
do $$
declare
  c text;
begin
  select con.conname into c
  from pg_constraint con
  join pg_class rel on rel.oid = con.conrelid
  join pg_namespace nsp on nsp.oid = rel.relnamespace
  join pg_attribute att on att.attrelid = rel.oid and att.attnum = any(con.conkey)
  where rel.relname = 'shops'
    and nsp.nspname = 'public'
    and att.attname = 'type'
    and con.contype = 'c';                -- 'c' = check constraint
  if c is not null then
    execute format('alter table public.shops drop constraint %I', c);
  end if;
end $$;

alter table public.shops drop constraint if exists shops_type_fkey;
alter table public.shops
  add constraint shops_type_fkey
  foreign key (type) references public.shop_categories(id);


-- 4. Row Level Security + privileges -------------------------
alter table public.shop_categories enable row level security;

drop policy if exists "categories_read" on public.shop_categories;
create policy "categories_read" on public.shop_categories
  for select using (true);

-- categories are read-only from the app (manage via dashboard / service role)
grant select on public.shop_categories to anon, authenticated;
