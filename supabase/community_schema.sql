-- ============================================================
-- Community feature schema: shops, reviews, and review votes
-- Run this in the Supabase Dashboard → SQL Editor → New query
-- Safe to re-run (uses IF NOT EXISTS / idempotent seeding).
-- ============================================================


-- 1. SHOP CATEGORIES ------------------------------------------
-- Source of truth for the app's filter chips + icons. Add a row here
-- and it shows up in the app automatically.
create table if not exists public.shop_categories (
  id          text primary key,           -- 'food', 'retail', ... (matches shops.type)
  label       text not null,              -- 'Food & Dining'
  icon        text not null,              -- Ionicons name, e.g. 'restaurant'
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now()
);

insert into public.shop_categories (id, label, icon, sort_order) values
  ('food',      'Food & Dining',            'restaurant', 1),
  ('retail',    'Retail & Groceries',       'storefront', 2),
  ('health',    'Healthcare & Wellness',    'medkit',     3),
  ('services',  'Professional Services',    'briefcase', 4),
  ('community', 'Community & Culture',       'people',     5)
on conflict (id) do nothing;


-- 2. SHOPS -----------------------------------------------------
create table if not exists public.shops (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  -- references shop_categories so new categories are usable automatically
  type          text not null references public.shop_categories(id),
  category      text not null,           -- human-readable label, e.g. "Food & Dining"
  description   text,
  lat           double precision not null,
  lng           double precision not null,
  image_url     text,
  images        text[] not null default '{}',  -- photo gallery (carousel + thumbnail)
  -- cached aggregates, kept in sync by the trigger below
  rating        double precision not null default 0,
  review_count  integer not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);


-- 3. SHOP REVIEWS ---------------------------------------------
-- One review per user per shop (unique constraint below).
create table if not exists public.shop_reviews (
  id          uuid primary key default gen_random_uuid(),
  shop_id     uuid not null references public.shops(id) on delete cascade,
  -- FK to profiles so the `profiles (...)` nested select works like comments
  user_id     uuid not null references public.profiles(id) on delete cascade,
  rating      smallint not null check (rating between 1 and 5),
  content     text not null default '',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (shop_id, user_id)
);


-- 4. REVIEW VOTES (up / down) --------------------------------
-- Mirrors the existing votes table, scoped to reviews.
create table if not exists public.shop_review_votes (
  id          uuid primary key default gen_random_uuid(),
  review_id   uuid not null references public.shop_reviews(id) on delete cascade,
  user_id     uuid not null references public.profiles(id) on delete cascade,
  vote_type   text not null check (vote_type in ('up','down')),
  created_at  timestamptz not null default now(),
  unique (review_id, user_id)
);


-- Indexes for fast lookups -----------------------------------
create index if not exists idx_shop_reviews_shop_id
  on public.shop_reviews(shop_id);

create index if not exists idx_shop_review_votes_review_id
  on public.shop_review_votes(review_id);


-- updated_at helper ------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists trg_shops_updated_at on public.shops;
create trigger trg_shops_updated_at
  before update on public.shops
  for each row execute function public.set_updated_at();

drop trigger if exists trg_shop_reviews_updated_at on public.shop_reviews;
create trigger trg_shop_reviews_updated_at
  before update on public.shop_reviews
  for each row execute function public.set_updated_at();


-- Keep shops.rating + shops.review_count in sync automatically.
-- SECURITY DEFINER: runs as the table owner (postgres) so it can UPDATE
-- shops even though app users can't. The fixed search_path guards against
-- search_path injection on SECURITY DEFINER functions.
create or replace function public.recalc_shop_rating()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  affected_shop_id uuid;
begin
  affected_shop_id := coalesce(new.shop_id, old.shop_id);

  update public.shops as s
  set rating       = coalesce(sub.avg_rating, 0),
      review_count = coalesce(sub.review_count, 0),
      updated_at   = now()
  from (
    select
      avg(rating)::double precision as avg_rating,
      count(*)::integer             as review_count
    from public.shop_reviews
    where shop_id = affected_shop_id
  ) as sub
  where s.id = affected_shop_id;

  return coalesce(new, old);
end;
$$;

drop trigger if exists trg_shop_reviews_rating on public.shop_reviews;
create trigger trg_shop_reviews_rating
  after insert or update or delete on public.shop_reviews
  for each row execute function public.recalc_shop_rating();


-- Anti-spam: limit how fast a user can post NEW reviews (INSERT only).
create or replace function public.enforce_review_rate_limit()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  recent_count   integer;
  last_review_at timestamptz;
begin
  if TG_OP <> 'INSERT' then
    return new;
  end if;

  -- Max 5 new reviews per user per rolling hour
  select count(*) into recent_count
  from public.shop_reviews
  where user_id = new.user_id
    and created_at > now() - interval '1 hour';
  if recent_count >= 5 then
    raise exception 'RATE_LIMIT: You are posting reviews too quickly. Please try again later.';
  end if;

  -- 60-second cooldown between reviews
  select max(created_at) into last_review_at
  from public.shop_reviews
  where user_id = new.user_id;
  if last_review_at is not null and now() - last_review_at < interval '60 seconds' then
    raise exception 'COOLDOWN: Please wait a moment before posting another review.';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_review_rate_limit on public.shop_reviews;
create trigger trg_review_rate_limit
  before insert on public.shop_reviews
  for each row execute function public.enforce_review_rate_limit();


-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
alter table public.shop_categories     enable row level security;
alter table public.shops              enable row level security;
alter table public.shop_reviews       enable row level security;
alter table public.shop_review_votes  enable row level security;

-- categories: readable by everyone; managed via dashboard / service_role
drop policy if exists "categories_read" on public.shop_categories;
create policy "categories_read" on public.shop_categories
  for select using (true);

-- shops: readable by everyone; writes only via dashboard / service_role
drop policy if exists "shops_read" on public.shops;
create policy "shops_read" on public.shops
  for select using (true);

-- reviews: everyone reads; users manage only their own
drop policy if exists "reviews_read"   on public.shop_reviews;
drop policy if exists "reviews_insert" on public.shop_reviews;
drop policy if exists "reviews_update" on public.shop_reviews;
drop policy if exists "reviews_delete" on public.shop_reviews;

create policy "reviews_read" on public.shop_reviews
  for select using (true);
create policy "reviews_insert" on public.shop_reviews
  for insert with check (user_id = auth.uid());
create policy "reviews_update" on public.shop_reviews
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "reviews_delete" on public.shop_reviews
  for delete using (user_id = auth.uid());

-- votes: everyone reads; users manage only their own
drop policy if exists "rvotes_read"   on public.shop_review_votes;
drop policy if exists "rvotes_insert" on public.shop_review_votes;
drop policy if exists "rvotes_update" on public.shop_review_votes;
drop policy if exists "rvotes_delete" on public.shop_review_votes;

create policy "rvotes_read" on public.shop_review_votes
  for select using (true);
create policy "rvotes_insert" on public.shop_review_votes
  for insert with check (user_id = auth.uid());
create policy "rvotes_update" on public.shop_review_votes
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "rvotes_delete" on public.shop_review_votes
  for delete using (user_id = auth.uid());


-- ============================================================
-- TABLE PRIVILEGES (GRANTs)
-- RLS policies define row access; these GRANTs give the anon /
-- authenticated roles base permission to touch the tables at all.
-- Tables created via raw SQL (not the Table Editor) need these.
-- ============================================================
-- categories: app reads only (writes via dashboard / service_role)
grant select on public.shop_categories to anon, authenticated;

-- shops: app reads only (writes via dashboard / service_role)
grant select on public.shops to anon, authenticated;

-- reviews: read for everyone; users write their own (enforced by RLS)
grant select, insert, update, delete on public.shop_reviews to anon, authenticated;

-- votes: read for everyone; users write their own (enforced by RLS)
grant select, insert, update, delete on public.shop_review_votes to anon, authenticated;


-- ============================================================
-- SEED DATA (optional) — your 8 mock locations.
-- Only runs if the shops table is empty.
-- ============================================================
insert into public.shops (name, type, category, lat, lng)
select * from (values
  ('Golden Mile Complex',     'food',      'Food & Dining',            1.3006::double precision, 103.8635::double precision),
  ('Shwe Myanmar Grocery',    'retail',    'Retail & Groceries',       1.3041, 103.8567),
  ('Myanmar Dental Clinic',   'health',    'Healthcare & Wellness',    1.2821, 103.8486),
  ('Peninsula Plaza',         'services',  'Professional Services',    1.2934, 103.8527),
  ('Burmese Buddhist Temple', 'community', 'Community & Culture',       1.3011, 103.8553),
  ('Inle Myanmar Restaurant', 'food',      'Food & Dining',            1.2852, 103.8461),
  ('Lucky Plaza',             'retail',    'Retail & Groceries',       1.3052, 103.8355),
  ('Myanmar Embassy',         'services',  'Professional Services',    1.2976, 103.8432)
) as v(name, type, category, lat, lng)
where not exists (select 1 from public.shops limit 1);
